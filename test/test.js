const { readFileSync } = require('fs')
const { join } = require('path')

const test = require('ava')
const prettier = require('prettier')

test('basic test', t => {
  const options = {
    filepath: 'general.js',
    parser: 'babel',
    plugins: ['.']
  }

  const input = readFileSync(
    join(__dirname, './fixtures/alphabetize.js'),
    'utf-8'
  )
  const output = prettier.format(input, options)
  t.snapshot(output)
})

test('another test', t => {
  const options = {
    filepath: 'general.js',
    parser: 'babel',
    plugins: ['.']
  }

  const input = readFileSync(join(__dirname, './fixtures/general.js'), 'utf-8')
  const output = prettier.format(input, options)
  t.snapshot(output)
})
