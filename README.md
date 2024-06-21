# Reactive maps

Contains several commonly used data structures enriched with reactivity.

Can be used in conjunction with RxJS or Svelte.

## Sets

Reactive set or list of reactive values.

Features:

- easily extended to implement custom storage based on equality
- merging of equivalent elements if equivalence is defined
- fast iteration over entries
- behaves like an [RxJS array observable](rxjs.dev/guide/overview)
- compatible with the Svelte auto-subscription with $-sign for user-defined stores.

For examples, see [tests](./lib/set/stream_of_sets.test.ts)

Implemented as a stream of sets of streams.

## Maps

Associative reactive arrays, also called reactive *maps* or reactive *dictionaries*.

Features:

- the keys can be anything that is serializable as JSON.
- values of the map are reactive, individual keys are not
- values can be reverted to an initial value or saved

For examples, see [tests](./lib/maps/hashMap.test.ts)

The implementation is an extension of a set where elements of the set are indexed by arbitrary serializable objects.

## Recursive maps

A special version of a reactive map that has a recursive index for keys. This means that for every key, also sub-keys or projections are indexed and put inside a map.

Features:

- key type safety when doing subspace look-ups
- fast lookup inside subspaces such as rows and columns
- fast iteration over all elements

If the index space is a vector of positive integers, this data structure corresponds to a [mathematical tensor](en.wikipedia.org/wiki/Tensor). That is why I use the name *tensor*. When the index space is one dimensional, this corresponds to a vector. When the index space is two-dimensional, this corresponds to a matrix.

For examples, see [tests](./lib/maps/tensor.test.ts)

Addition or removal is a recursive action. It does depth-first traversal through the index tree. Performance improvements for over 10000 nodes are still in progress, though it is already useful for complex interactive data grids of less than 1000 rows.

## Graphs

Normal graph with a reactive list of nodes and reactive edges. There is also a topological graph. This is a graph where the edges have weights.

Features:

- reactive edges
- shortest path between nodes

Implementation of shortest path is the the Dijkstra shortest path algorithm. The shortest path is stored in a two-dimensional tensor.

## Credits

Written during a trip to Austria in April 2023.
