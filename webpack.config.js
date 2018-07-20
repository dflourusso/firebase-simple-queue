var path = require('path')

module.exports = {
  entry: './index.js',
  mode: 'production',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'firebase-simple-queue.js'
  },
  externals: {
    'firebase-admin': 'firebase-admin',
    'firebase-functions': 'firebase-functions'
  }
}
