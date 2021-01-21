import * as Benchmark from 'benchmark'
import * as A from '../../src/ReadonlyArray'
import * as IO from '../../src/IO'
import { pipe } from '../../src/function'

/*
for an array with size 1000
A.sequence(IO.Applicative) x 20,063 ops/sec ±2.88% (84 runs sampled)
IO.sequenceReadonlyArray x 31,780,061 ops/sec ±4.52% (85 runs sampled)
Fastest is IO.sequenceReadonlyArray
*/

const suite = new Benchmark.Suite()

const arrIO = pipe(A.range(0, 1000), A.map(IO.of))

suite
  .add('A.sequence(IO.io)', function () {
    pipe(arrIO, A.sequence(IO.Applicative))
  })
  .add('IO.sequenceReadonlyArray', function () {
    pipe(arrIO, IO.sequenceReadonlyArray)
  })
  .on('cycle', function (event: any) {
    // tslint:disable-next-line: no-console
    console.log(String(event.target))
  })
  .on('complete', function (this: any) {
    // tslint:disable-next-line: no-console
    console.log('Fastest is ' + this.filter('fastest').map('name'))
  })
  .run({ async: true })