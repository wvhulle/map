# Iterable Data Structures

Contains several commonly used data structures enriched with reactivity:

- sets: has entries which can be iterated through and behaves as an
    <a href="https://rxjs.dev/guide/overview">RxJS array observable</a>.
- hash-maps: the values of the map are reactive and their values can be
    reverted to an initial value.
- tensors: see <a href="https://en.wikipedia.org/wiki/Tensor">tensor</a>, arbitrary objects
    to be used as indexes, such as database primary keys, instead of vectors of integers.
    Performance improvements for over 10000 nodes are still in progress, though it
    is already useful for complex interactive data grids of less than 1000 rows.
- graphs: Dijkstra shortest path algorithm built-in
