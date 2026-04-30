/**
 * Drill store — in-memory store for test environment, mirrors IndexedDB API shape.
 * In the browser, this will be backed by IndexedDB. For tests, we use a simple array.
 */

const CURRENT_VERSION = 1;

export class DrillStore {
  constructor() {
    this._drills = [];
  }

  /** Save a drill result. */
  save(result) {
    this._drills.push({ ...result });
  }

  /** Get all drill results. */
  getAll() {
    return [...this._drills];
  }

  /** Get drill results filtered by type. */
  getByType(type) {
    return this._drills.filter(d => d.type === type);
  }

  /** Clear all data. */
  clear() {
    this._drills = [];
  }

  /**
   * Export all data as a versioned JSON object.
   * @returns {{ version: number, exported: string, data: { drills: object[] } }}
   */
  export() {
    return {
      version: CURRENT_VERSION,
      exported: new Date().toISOString().slice(0, 10),
      data: {
        drills: this.getAll(),
      },
    };
  }

  /**
   * Import data from a JSON object.
   * @param {{ version: number, data: { drills: object[] } }} blob
   * @param {{ merge?: boolean }} options
   */
  import(blob, options = {}) {
    if (blob.version !== CURRENT_VERSION) {
      throw new Error(`Unsupported version: ${blob.version}. Expected ${CURRENT_VERSION}.`);
    }

    if (options.merge) {
      this._drills.push(...blob.data.drills.map(d => ({ ...d })));
    } else {
      this._drills = blob.data.drills.map(d => ({ ...d }));
    }
  }
}
