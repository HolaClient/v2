module.exports = {
  mode: 'jit',
  content: [
    "./resources/views/*.hcx",
    "./resources/views/**/*.hcx",
    "./public/**/*.{html,js}",
    "./public/**/**/*.{html,js}"
  ],
  output: "./public/common/tailwind.css",
  theme: {},
  plugins: [],
}