import { Queue } from "./queue.js";

import { assert, describe, it } from "vitest";

describe("priority queue properties", () => {
	it("Priority Queue enqueue", () => {
		const pq = new Queue<number>({ sort: (a) => a });
		pq.enqueue(1);
		pq.enqueue(2);
		pq.enqueue(3);
		assert.equal(pq.size, 3);
	});

	it("Priority Queue dequeue", () => {
		const pq = new Queue<number>({ sort: (a) => a });
		pq.enqueue(1);
		pq.enqueue(2);
		pq.enqueue(3);
		assert.equal(pq.dequeue(), 1);
		assert.equal(pq.dequeue(), 2);
	});

	it("Priority Queue peek", () => {
		const pq = new Queue<number>({ sort: (a) => a });
		pq.enqueue(1);
		pq.enqueue(2);
		pq.enqueue(3);
		assert.equal(pq.peek(), 1);
	});

	it("Priority Queue isEmpty", () => {
		const pq = new Queue<number>({ sort: (a) => a });
		pq.enqueue(1);
		pq.enqueue(2);
		pq.enqueue(3);
		assert.equal(pq.isEmpty(), false);
	});

	it("Priority Queue size", () => {
		const pq = new Queue<number>({ sort: (a) => a });
		pq.enqueue(1);
		pq.enqueue(2);
		pq.enqueue(3);
		assert.equal(pq.size, 3);
	});
});
