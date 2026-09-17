import fs from 'fs';
import path from 'path';
import JSZip from 'jszip';

async function createPortMasterPackage() {
  console.log('[PortMaster Packager] Creating RomM.zip with JSZip...');
  const zip = new JSZip();

  const portmasterDir = path.resolve('portmaster');
  const launchScriptPath = path.join(portmasterDir, 'RomM Client.sh');

  if (!fs.existsSync(launchScriptPath)) {
    throw new Error(`Launch script not found: ${launchScriptPath}`);
  }

  // Add the root launch scripts with executable permissions (0755)
  const launchScriptContent = fs.readFileSync(launchScriptPath, 'utf8');
  zip.file('RomM Client.sh', launchScriptContent, {
    unixPermissions: '755',
  });

  const rommShPath = path.join(portmasterDir, 'RomM.sh');
  if (fs.existsSync(rommShPath)) {
    zip.file('RomM.sh', fs.readFileSync(rommShPath, 'utf8'), {
      unixPermissions: '755',
    });
  }

  const installScriptPath = path.join(portmasterDir, 'install_Romr36s.sh');
  if (fs.existsSync(installScriptPath)) {
    zip.file('install_Romr36s.sh', fs.readFileSync(installScriptPath, 'utf8'), {
      unixPermissions: '755',
    });
  }

  const updateScriptPath = path.join(portmasterDir, 'update_RomM.sh');
  if (fs.existsSync(updateScriptPath)) {
    zip.file('update_RomM.sh', fs.readFileSync(updateScriptPath, 'utf8'), {
      unixPermissions: '755',
    });
  } else if (fs.existsSync('update_RomM.sh')) {
    zip.file('update_RomM.sh', fs.readFileSync('update_RomM.sh', 'utf8'), {
      unixPermissions: '755',
    });
  }

  // Helper to recursively add a directory to zip
  function addDirectoryToZip(dirPath, zipFolder) {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        const subFolder = zipFolder.folder(entry.name);
        addDirectoryToZip(fullPath, subFolder);
      } else if (entry.isFile()) {
        const fileContent = fs.readFileSync(fullPath);
        zipFolder.file(entry.name, fileContent);
      }
    }
  }

  const rommDir = path.join(portmasterDir, 'romm');
  const rommFolder = zip.folder('romm');
  addDirectoryToZip(rommDir, rommFolder);

  console.log('[PortMaster Packager] Generating zip buffer with DEFLATE compression...');
  const content = await zip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 9 },
    platform: 'UNIX',
  });

  // Ensure directories exist
  const publicDownloads = path.resolve('public/downloads');
  if (!fs.existsSync(publicDownloads)) {
    fs.mkdirSync(publicDownloads, { recursive: true });
  }

  fs.writeFileSync(path.resolve('public/downloads/RomM.zip'), content);
  fs.writeFileSync(path.resolve('RomM.zip'), content);

  const stats = fs.statSync('RomM.zip');
  console.log(`[PortMaster Packager] ✓ Package created successfully!`);
  console.log(`[PortMaster Packager] File: RomM.zip (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
  console.log(`[PortMaster Packager] Saved to: RomM.zip and public/downloads/RomM.zip`);
}

createPortMasterPackage().catch((err) => {
  console.error('[PortMaster Packager] Error:', err);
  process.exit(1);
});
