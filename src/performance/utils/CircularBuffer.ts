/**
 * A circular buffer with a fixed capacity that efficiently handles adding and retrieving items.
 * When the buffer is full, adding a new item will overwrite the oldest item.
 */
export class CircularBuffer<T> {
    private buffer: T[] = [];
    private index = 0;
    private _length = 0;

    /**
     * Creates a new CircularBuffer with the specified capacity
     * @param capacity Maximum number of items the buffer can hold
     */
    constructor(private readonly capacity: number) {
        if (capacity <= 0) {
            throw new Error('Capacity must be greater than 0');
        }
    }

    /**
     * Adds an item to the buffer, overwriting the oldest item if the buffer is full
     * @param item The item to add
     */
    push(item: T): void {
        if (this._length < this.capacity) {
            this.buffer.push(item);
            this._length++;
        } else {
            this.buffer[this.index] = item;
        }
        this.index = (this.index + 1) % this.capacity;
    }

    /**
     * Returns all items in the buffer in order from oldest to newest
     */
    toArray(): T[] {
        if (this._length < this.capacity) {
            return [...this.buffer];
        }
        return [...this.buffer.slice(this.index), ...this.buffer.slice(0, this.index)];
    }

    /**
     * Gets the current number of items in the buffer
     */
    get length(): number {
        return this._length;
    }

    /**
     * Gets the item at the specified index (0 = oldest)
     * @param index Zero-based index of the item to retrieve
     */
    get(index: number): T | undefined {
        if (index < 0 || index >= this._length) {
            return undefined;
        }
        return this.buffer[(this.index + index) % this.capacity];
    }

    /**
     * Gets the most recently added item
     */
    getLatest(): T | undefined {
        if (this._length === 0) {return undefined;}
        return this.get(this._length - 1);
    }

    /**
     * Gets the oldest item in the buffer
     */
    getOldest(): T | undefined {
        if (this._length === 0) {return undefined;}
        return this.get(0);
    }

    /**
     * Removes all items from the buffer
     */
    clear(): void {
        this.buffer = [];
        this.index = 0;
        this._length = 0;
    }
}
