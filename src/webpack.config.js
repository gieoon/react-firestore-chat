module.exports = {
    module: {
      rules: [
        {
          test: /\.css$/i,
          use: ['style-loader', 'sass-loader', 'css-loader'],
        },
      ],
    },
};