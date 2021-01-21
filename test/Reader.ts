import { pipe } from '../src/function'
import * as _ from '../src/Reader'
import * as RA from '../src/ReadonlyArray'
import { deepStrictEqual } from './util'

interface Env {
  readonly count: number
}

describe('Reader', () => {
  describe('pipeables', () => {
    it('map', () => {
      const double = (n: number): number => n * 2
      deepStrictEqual(pipe(_.of(1), _.map(double))({}), 2)
    })

    it('ap', () => {
      const double = (n: number): number => n * 2
      deepStrictEqual(pipe(_.of(double), _.ap(_.of(1)))({}), 2)
    })

    it('apFirst', () => {
      deepStrictEqual(pipe(_.of('a'), _.apFirst(_.of('b')))({}), 'a')
    })

    it('apSecond', () => {
      deepStrictEqual(pipe(_.of('a'), _.apSecond(_.of('b')))({}), 'b')
    })

    it('chain', () => {
      const f = (s: string): _.Reader<object, number> => _.of(s.length)
      deepStrictEqual(pipe(_.of('foo'), _.chain(f))({}), 3)
    })

    it('chainFirst', () => {
      const f = (s: string): _.Reader<object, number> => _.of(s.length)
      deepStrictEqual(pipe(_.of('foo'), _.chainFirst(f))({}), 'foo')
    })

    it('chain', () => {
      deepStrictEqual(pipe(_.of(_.of('a')), _.flatten)({}), 'a')
    })

    it('compose', () => {
      const double = (n: number) => n * 2
      const len = (s: string) => s.length
      deepStrictEqual(pipe(len, _.compose(double))('aaa'), 6)
    })

    it('promap', () => {
      const x = (s: string) => s.length
      const reader = pipe(
        x,
        _.promap(
          (a: { readonly name: string }) => a.name,
          (n) => n >= 2
        )
      )
      deepStrictEqual(reader({ name: 'foo' }), true)
      deepStrictEqual(reader({ name: 'a' }), false)
    })
  })

  it('of', () => {
    deepStrictEqual(_.of(1)({}), 1)
  })

  it('local', () => {
    interface E {
      readonly name: string
    }
    const x = pipe(
      (s: string) => s.length,
      _.local((e: E) => e.name)
    )
    deepStrictEqual(x({ name: 'foo' }), 3)
  })

  it('id', () => {
    const x = _.id<number>()
    deepStrictEqual(x(1), 1)
  })

  it('ask', () => {
    const e: Env = { count: 0 }
    deepStrictEqual(_.ask<Env>()(e), e)
  })

  it('asks', () => {
    const e: Env = { count: 0 }
    const f = (e: Env) => e.count + 1
    deepStrictEqual(_.asks(f)(e), 1)
  })

  it('do notation', () => {
    deepStrictEqual(
      pipe(
        _.of(1),
        _.bindTo('a'),
        _.bind('b', () => _.of('b'))
      )(undefined),
      { a: 1, b: 'b' }
    )
  })

  it('apS', () => {
    deepStrictEqual(pipe(_.of(1), _.bindTo('a'), _.apS('b', _.of('b')))(undefined), { a: 1, b: 'b' })
  })

  it('apT', () => {
    deepStrictEqual(pipe(_.of(1), _.tupled, _.apT(_.of('b')))({}), [1, 'b'])
  })

  describe('array utils', () => {
    it('sequenceReadonlyArray', () => {
      const arr = RA.range(0, 10)
      deepStrictEqual(pipe(arr, RA.map(_.of), _.sequenceReadonlyArray)(undefined), arr)
    })

    it('traverseReadonlyArray', () => {
      const arr = RA.range(0, 10)
      deepStrictEqual(pipe(arr, _.traverseReadonlyArray(_.of))(undefined), arr)
    })

    it('traverseReadonlyArrayWithIndex', () => {
      const arr = RA.range(0, 10)
      deepStrictEqual(
        pipe(
          arr,
          _.traverseReadonlyArrayWithIndex((index, _data) => _.of(index))
        )(undefined),
        arr
      )
    })
  })
})
