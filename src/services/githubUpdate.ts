import { GitHubReleaseInfo } from '../types';

/**
 * Normalizes user repo string (e.g. "https://github.com/Cavephar/RomM-R36S" -> "Cavephar/RomM-R36S")
 */
export function normalizeRepoString(input: string): { owner: string; repo: string } | null {
  if (!input || !input.trim()) return null;
  let clean = input.trim();
  // Remove trailing .git
  clean = clean.replace(/\.git$/i, '');
  // Remove protocol / domain if pasted as full URL
  clean = clean.replace(/^https?:\/\/github\.com\//i, '');
  // Remove leading/trailing slashes
  clean = clean.replace(/^\/+|\/+$/g, '');

  const parts = clean.split('/');
  if (parts.length >= 2) {
    return { owner: parts[0], repo: parts[1] };
  }
  return null;
}

/**
 * Compares two semantic version strings (e.g., "v1.3.1" vs "v1.3.0")
 * Returns true if remote is newer than local.
 */
export function isRemoteVersionNewer(remoteVer: string, localVer: string): boolean {
  if (!remoteVer) return false;
  if (!localVer) return true;

  const rClean = remoteVer.replace(/^v/i, '').trim();
  const lClean = localVer.replace(/^v/i, '').trim();

  if (rClean === lClean) return false;

  const rParts = rClean.split('.').map((p) => parseInt(p, 10) || 0);
  const lParts = lClean.split('.').map((p) => parseInt(p, 10) || 0);

  const len = Math.max(rParts.length, lParts.length);
  for (let i = 0; i < len; i++) {
    const r = rParts[i] || 0;
    const l = lParts[i] || 0;
    if (r > l) return true;
    if (r < l) return false;
  }

  // If semantic versions match but string differs, check string inequality
  return rClean !== lClean;
}

/**
 * Fetches latest release or latest commit from GitHub repository
 */
export async function checkForGitHubUpdates(
  repoInput: string,
  currentVersion = 'v1.3.0',
  branch = 'main'
): Promise<GitHubReleaseInfo> {
  const parsed = normalizeRepoString(repoInput);
  if (!parsed) {
    throw new Error(`Invalid GitHub repository format: "${repoInput}". Please use "owner/repository".`);
  }

  const { owner, repo } = parsed;

  // 1. Try querying Releases API first
  const releaseUrl = `https://api.github.com/repos/${owner}/${repo}/releases/latest`;
  try {
    const res = await fetch(releaseUrl, {
      headers: {
        Accept: 'application/vnd.github.v3+json',
      },
    });

    if (res.ok) {
      const data = await res.json();
      const tagName = data.tag_name || data.name || 'v1.0.0';
      const hasUpdate = isRemoteVersionNewer(tagName, currentVersion);

      // Look for RomM.zip asset if packaged
      let downloadZipUrl: string | undefined = undefined;
      if (Array.isArray(data.assets) && data.assets.length > 0) {
        const zipAsset = data.assets.find((a: { name?: string; browser_download_url?: string }) =>
          a.name?.toLowerCase().endsWith('.zip')
        );
        if (zipAsset) {
          downloadZipUrl = zipAsset.browser_download_url;
        }
      }

      return {
        tagName,
        name: data.name || tagName,
        publishedAt: data.published_at ? new Date(data.published_at).toLocaleDateString() : 'Recent',
        body: data.body || 'No release notes provided for this release.',
        htmlUrl: data.html_url || `https://github.com/${owner}/${repo}/releases`,
        zipballUrl: data.zipball_url,
        downloadZipUrl: downloadZipUrl || data.zipball_url,
        hasUpdate,
        isCommitBased: false,
      };
    }

    if (res.status === 403) {
      const rateLimitReset = res.headers.get('X-RateLimit-Reset');
      const resetTime = rateLimitReset
        ? new Date(parseInt(rateLimitReset, 10) * 1000).toLocaleTimeString()
        : 'in a few minutes';
      throw new Error(`GitHub API rate limit exceeded. Please try again ${resetTime}.`);
    }

    // If 404 (no releases published yet), fallback to checking commits!
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    if (errorMsg.includes('rate limit')) {
      throw err;
    }
    // Proceed to commit fallback
    console.info('No published GitHub releases found. Falling back to latest commit on branch:', branch);
  }

  // 2. Commit Fallback (common when working directly from git repository)
  const commitsUrl = `https://api.github.com/repos/${owner}/${repo}/commits/${encodeURIComponent(branch)}`;
  try {
    const commitRes = await fetch(commitsUrl, {
      headers: {
        Accept: 'application/vnd.github.v3+json',
      },
    });

    if (commitRes.ok) {
      const commitData = await commitRes.json();
      const shaShort = commitData.sha ? commitData.sha.substring(0, 7) : 'HEAD';
      const commitMsg = commitData.commit?.message?.split('\n')[0] || 'Latest commit';
      const author = commitData.commit?.author?.name || commitData.author?.login || 'Author';
      const date = commitData.commit?.author?.date
        ? new Date(commitData.commit.author.date).toLocaleDateString()
        : 'Recent';

      // Check if current version matches commit sha
      const isSameCommit = currentVersion.includes(shaShort);

      return {
        tagName: `commit ${shaShort}`,
        name: commitMsg,
        publishedAt: date,
        body: `Latest commit on branch "${branch}":\n\n${commitData.commit?.message || ''}\n\nAuthored by: ${author}`,
        htmlUrl: commitData.html_url || `https://github.com/${owner}/${repo}/commits/${branch}`,
        zipballUrl: `https://github.com/${owner}/${repo}/archive/refs/heads/${branch}.zip`,
        downloadZipUrl: `https://github.com/${owner}/${repo}/archive/refs/heads/${branch}.zip`,
        hasUpdate: !isSameCommit,
        isCommitBased: true,
        commitSha: shaShort,
        commitMessage: commitMsg,
        author,
      };
    }

    if (commitRes.status === 404) {
      throw new Error(`Repository "${owner}/${repo}" or branch "${branch}" was not found on GitHub.`);
    }

    throw new Error(`GitHub returned status HTTP ${commitRes.status}`);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`Failed to check updates from GitHub (${owner}/${repo}): ${msg}`);
  }
}
