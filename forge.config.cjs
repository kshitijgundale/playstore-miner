module.exports = {
  packagerConfig: {
    name: 'Play Store Miner',
    executableName: 'Play Store Miner',
    appBundleId: 'local.playstoreminer.desktop',
    asar: true,
    ignore: [
      /(^|\/)\.env(?:\.|$)/,
      /^\/(?:data|server\/test)(?:\/|$)/,
      /\.sqlite(?:-(?:wal|shm))?$/,
      /^\/(?:openspec|\.git|\.codex|\.agents|out)(?:\/|$)/,
      /^\/client\/src(?:\/|$)/,
      /^\/server\/data(?:\/|$)/,
      /^\/README\.md$/
    ]
  }
};
