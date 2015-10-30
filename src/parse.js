import _ from 'lodash'

export default function *parse({phrase, input, options}) {
  yield* parseElement({phrase, input, options})
}

function *parseElement({phrase, input, options}) {
  if (phrase.__describedPhrase) {
    const iterator = parse({phrase: phrase.__describedPhrase, input, options})
    for (let output of iterator) {
      let result, getValue

      if (phrase.__oldExtensions.length) {
        const key = _.keys(output.result)[0]
        result = output.result[key]
        getValue = key === '0' && phrase.getValue ? phrase.getValue.bind(phrase) : null

      } else {
        result = output.result
        if (phrase.getValue) {
          getValue = phrase.getValue.bind(phrase)
        }
      }

      if (!phrase.filter || phrase.filter(result)) {
        const trueResult = getValue ? getValue(result) : result
        const newOutput = _.assign({}, output, {result: trueResult})

        yield newOutput
      }
    }
  } else if (phrase._handleParse) {
    yield* phrase._handleParse(input, options, parse)
  } else {
    //noop
  }

  options.sourceManager.markSourceUpToDate(phrase)
}
