/**
 * Technique store — persistent storage for user's mnemonic system tables.
 * Stores Major System custom words, PAO tables, peg lists, etc.
 * In-memory for tests; IndexedDB in the browser.
 */

const CURRENT_VERSION = 1;

export class TechniqueStore {
  constructor() {
    this._tables = {};
  }

  /** List all saved table names. */
  listTables() {
    return Object.keys(this._tables);
  }

  /** Get a table by name. Returns null if not found. */
  getTable(name) {
    const table = this._tables[name];
    return table ? JSON.parse(JSON.stringify(table)) : null;
  }

  /** Save (or overwrite) a table. */
  saveTable(name, data) {
    this._tables[name] = JSON.parse(JSON.stringify(data));
  }

  /** Delete a table. */
  deleteTable(name) {
    delete this._tables[name];
  }

  /** Update a single entry within a table. */
  updateEntry(name, key, value) {
    if (!this._tables[name]) {
      throw new Error(`Table "${name}" does not exist`);
    }
    this._tables[name][key] = JSON.parse(JSON.stringify(value));
  }

  /** Export all tables. */
  export() {
    return {
      version: CURRENT_VERSION,
      exported: new Date().toISOString().slice(0, 10),
      tables: JSON.parse(JSON.stringify(this._tables)),
    };
  }

  /** Import tables. */
  import(blob, options = {}) {
    if (blob.version !== CURRENT_VERSION) {
      throw new Error(`Unsupported version: ${blob.version}`);
    }
    if (options.merge) {
      for (const [name, data] of Object.entries(blob.tables)) {
        this._tables[name] = JSON.parse(JSON.stringify(data));
      }
    } else {
      this._tables = JSON.parse(JSON.stringify(blob.tables));
    }
  }
}
