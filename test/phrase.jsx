/** @jsx phrase.createElement */
/* eslint-env mocha */
import chai, {expect} from 'chai'
import fulltext from 'lacona-util-fulltext'
import * as lacona from '..'
import * as phrase from 'lacona-phrase'

function from(i) {const a = []; for (let x of i) a.push(x); return a}

describe('Phrase', () => {
  var parser
  beforeEach(() => {
    parser = new lacona.Parser()
  })

  it('handles phrases with supplements', () => {
    class Extended extends phrase.Phrase {
      describe() { return <literal text='test a' /> }
    }

    class Extender extends phrase.Phrase {
      describe() { return <literal text='test b' /> }
      static get supplements() { return [Extended] }
    }

    parser.sentences = [<Extended />]
    parser.extensions = [Extender]

    const data = from(parser.parse('t'))
    expect(data).to.have.length(2)
    expect(fulltext.suggestion(data[0])).to.equal('test a')
    expect(fulltext.suggestion(data[1])).to.equal('test b')
  })

  it('accepts supplements being removed', () => {
    class Extended extends phrase.Phrase {
      describe() { return <literal text='test a' /> }
    }

    class Extender extends phrase.Phrase {
      describe() { return <literal text='test b' /> }
      static get supplements() {return [Extended]}
    }

    parser.sentences = [<Extended />]
    parser.extensions = [Extender]

    const data1 = from(parser.parse('t'))
    expect(data1).to.have.length(2)
    expect(fulltext.all(data1[0])).to.equal('test a')
    expect(fulltext.all(data1[1])).to.equal('test b')

    parser.extensions = []

    const data2 = from(parser.parse('t'))
    expect(data2).to.have.length(1)
    expect(fulltext.all(data2[0])).to.equal('test a')
  })

  it('handles phrases with overriding', () => {
    class Overridden extends phrase.Phrase {
      describe() { return <literal text='test a' /> }
    }
    class Overrider extends phrase.Phrase {
      describe() { return <literal text='test b' /> }
      static get overrides() {return [Overridden]}
    }

    parser.sentences = [<Overridden />]
    parser.extensions = [Overrider]

    const data = from(parser.parse('t'))
    expect(data).to.have.length(1)
    expect(fulltext.suggestion(data[0])).to.equal('test b')
  })

  it('allows for recursive phrases without creating an infinite loop', () => {
    class Test extends phrase.Phrase {
      describe() {
        return (
          <sequence>
            <literal text='na' />
            <choice>
              <literal text='nopeman' />
              <Test />
            </choice>
          </sequence>
        )
      }
    }

    parser.sentences = [<Test />]

    const data = from(parser.parse('nan'))
    expect(data).to.have.length(2)
    expect(fulltext.match(data[0])).to.equal('na')
    expect(fulltext.suggestion(data[0])).to.equal('nopeman')
    expect(fulltext.match(data[1])).to.equal('na')
    expect(fulltext.suggestion(data[1])).to.equal('na')
  })

  it('allows for nested phrases with the same id', () => {
    class Test extends phrase.Phrase {
      describe() { return <Include1 id='test' /> }
    }
    class Include1 extends phrase.Phrase {
      describe() { return <Include2 id='test' /> }
    }
    class Include2 extends phrase.Phrase {
      describe() { return <literal text='disp' value='val' id='test' /> }
    }

    parser.sentences = [<Test />]

    const data = from(parser.parse('d'))
    expect(data).to.have.length(1)
    expect(fulltext.suggestion(data[0])).to.equal('disp')
    expect(data[0].result.test.test.test).to.equal('val')
  })

  it('calls getValue in the phrase context', () => {
    class Test extends phrase.Phrase {
      getValue(result) {
        expect(this.props.test).to.equal('myProp')
        expect(result).to.eql({myId: 'myVal'})
        return 'nope'
      }
      describe() { return <literal id='myId' value='myVal' text='test' /> }
    }

    parser.sentences = [<Test test='myProp' />]

    const data = from(parser.parse('t'))
    expect(data).to.have.length(1)
    expect(data[0].result).to.equal('nope')
  })

  it('sentence passes on result if getValue was not supplied', () => {
    class Test extends phrase.Phrase {
      describe() { return <literal id='myId' value='myVal' text='test' /> }
    }

    parser.sentences = [<Test test='myProp' />]

    const data = from(parser.parse('t'))
    expect(data).to.have.length(1)
    expect(data[0].result).to.eql({myId: 'myVal'})
  })
})
