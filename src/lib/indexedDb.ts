import { RecordingItem, VideoComment, EmojiReaction, RecorderSettings } from '../types';

const DB_NAME = 'LocalLoomDB';
const DB_VERSION = 1;

export class LocalLoomDatabase {
  private dbPromise: Promise<IDBDatabase>;

  constructor() {
    this.dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        if (!db.objectStoreNames.contains('recordings')) {
          const recordingStore = db.createObjectStore('recordings', { keyPath: 'id' });
          recordingStore.createIndex('createdAt', 'createdAt', { unique: false });
        }

        if (!db.objectStoreNames.contains('comments')) {
          const commentStore = db.createObjectStore('comments', { keyPath: 'id' });
          commentStore.createIndex('recordingId', 'recordingId', { unique: false });
        }

        if (!db.objectStoreNames.contains('reactions')) {
          const reactionStore = db.createObjectStore('reactions', { keyPath: 'id' });
          reactionStore.createIndex('recordingId', 'recordingId', { unique: false });
        }

        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'id' });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // --- Recordings Store ---
  async saveRecording(recording: RecordingItem): Promise<void> {
    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      const tx = db.transaction('recordings', 'readwrite');
      const store = tx.objectStore('recordings');
      const req = store.put(recording);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async getAllRecordings(): Promise<RecordingItem[]> {
    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      const tx = db.transaction('recordings', 'readonly');
      const store = tx.objectStore('recordings');
      const index = store.index('createdAt');
      const req = index.openCursor(null, 'prev'); // sorted newest first
      const results: RecordingItem[] = [];

      req.onsuccess = (e) => {
        const cursor = (e.target as IDBRequest<IDBCursorWithValue>).result;
        if (cursor) {
          results.push(cursor.value);
          cursor.continue();
        } else {
          resolve(results);
        }
      };
      req.onerror = () => reject(req.error);
    });
  }

  async getRecordingById(id: string): Promise<RecordingItem | null> {
    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      const tx = db.transaction('recordings', 'readonly');
      const store = tx.objectStore('recordings');
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  }

  async updateRecording(recording: RecordingItem): Promise<void> {
    return this.saveRecording(recording);
  }

  async deleteRecording(id: string): Promise<void> {
    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      const tx = db.transaction(['recordings', 'comments', 'reactions'], 'readwrite');
      tx.objectStore('recordings').delete(id);

      // Clean comments
      const commentStore = tx.objectStore('comments');
      const commentIndex = commentStore.index('recordingId');
      const commentReq = commentIndex.openCursor(IDBKeyRange.only(id));
      commentReq.onsuccess = (e) => {
        const cursor = (e.target as IDBRequest<IDBCursorWithValue>).result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        }
      };

      // Clean reactions
      const reactionStore = tx.objectStore('reactions');
      const reactionIndex = reactionStore.index('recordingId');
      const reactionReq = reactionIndex.openCursor(IDBKeyRange.only(id));
      reactionReq.onsuccess = (e) => {
        const cursor = (e.target as IDBRequest<IDBCursorWithValue>).result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        }
      };

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  // --- Comments Store ---
  async addComment(comment: VideoComment): Promise<void> {
    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      const tx = db.transaction('comments', 'readwrite');
      const store = tx.objectStore('comments');
      const req = store.put(comment);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async getCommentsByRecording(recordingId: string): Promise<VideoComment[]> {
    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      const tx = db.transaction('comments', 'readonly');
      const store = tx.objectStore('comments');
      const index = store.index('recordingId');
      const req = index.getAll(IDBKeyRange.only(recordingId));
      req.onsuccess = () => {
        const results = (req.result || []) as VideoComment[];
        results.sort((a, b) => a.timestamp - b.timestamp);
        resolve(results);
      };
      req.onerror = () => reject(req.error);
    });
  }

  async deleteComment(commentId: string): Promise<void> {
    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      const tx = db.transaction('comments', 'readwrite');
      const store = tx.objectStore('comments');
      const req = store.delete(commentId);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  // --- Reactions Store ---
  async addReaction(reaction: EmojiReaction): Promise<void> {
    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      const tx = db.transaction('reactions', 'readwrite');
      const store = tx.objectStore('reactions');
      const req = store.put(reaction);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async getReactionsByRecording(recordingId: string): Promise<EmojiReaction[]> {
    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      const tx = db.transaction('reactions', 'readonly');
      const store = tx.objectStore('reactions');
      const index = store.index('recordingId');
      const req = index.getAll(IDBKeyRange.only(recordingId));
      req.onsuccess = () => resolve((req.result || []) as EmojiReaction[]);
      req.onerror = () => reject(req.error);
    });
  }

  // --- Settings Store ---
  async getSettings(): Promise<RecorderSettings> {
    const defaultSettings: RecorderSettings = {
      defaultResolution: '1080p',
      defaultFps: 30,
      audioEnabled: true,
      systemAudioEnabled: true,
      cameraEnabled: true,
      cameraPipShape: 'circle',
      countdownDuration: 3,
      autoPurgeDays: 0,
      localEncryptionEnabled: false,
    };

    const db = await this.dbPromise;
    return new Promise((resolve) => {
      const tx = db.transaction('settings', 'readonly');
      const store = tx.objectStore('settings');
      const req = store.get('user_settings');
      req.onsuccess = () => {
        resolve(req.result ? { ...defaultSettings, ...req.result.data } : defaultSettings);
      };
      req.onerror = () => resolve(defaultSettings);
    });
  }

  async saveSettings(settings: RecorderSettings): Promise<void> {
    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      const tx = db.transaction('settings', 'readwrite');
      const store = tx.objectStore('settings');
      const req = store.put({ id: 'user_settings', data: settings });
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  // --- Storage Quota Estimation ---
  async getStorageEstimate(): Promise<{ usage: number; quota: number }> {
    if (navigator.storage && navigator.storage.estimate) {
      const estimate = await navigator.storage.estimate();
      return {
        usage: estimate.usage || 0,
        quota: estimate.quota || 1024 * 1024 * 1024 * 5, // fallback 5GB
      };
    }
    return { usage: 0, quota: 1024 * 1024 * 1024 * 5 };
  }
}

export const dbService = new LocalLoomDatabase();
