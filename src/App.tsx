/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { LandingPage } from './components/LandingPage';
import { RecorderApp } from './components/RecorderApp';
import { VideoLibrary } from './components/VideoLibrary';
import { ExtensionStudio } from './components/ExtensionStudio';
import { VideoPlayerModal } from './components/VideoPlayerModal';
import { PrivacyModal } from './components/PrivacyModal';
import { RecordingItem } from './types';
import { dbService } from './lib/indexedDb';

export default function App() {
  const [activeTab, setActiveTab] = useState<'landing' | 'recorder' | 'library' | 'extension'>('landing');
  const [recordingsCount, setRecordingsCount] = useState<number>(0);
  const [activeSelectedRecording, setActiveSelectedRecording] = useState<RecordingItem | null>(null);
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState<boolean>(false);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  // Sync count of saved recordings
  useEffect(() => {
    const loadCount = async () => {
      try {
        const items = await dbService.getAllRecordings();
        setRecordingsCount(items.length);
      } catch (err) {
        console.warn('Error fetching recordings count:', err);
      }
    };
    loadCount();
  }, [refreshTrigger, activeTab]);

  const handleRecordingSaved = (recording: RecordingItem) => {
    setRefreshTrigger((prev) => prev + 1);
    setActiveSelectedRecording(recording);
  };

  return (
    <div id="app-root-container" className="min-h-screen bg-[#0A0A0C] text-[#E0E0E6] font-sans selection:bg-[#00FF9D] selection:text-black">
      {/* Top Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onQuickRecord={() => setActiveTab('recorder')}
        recordingsCount={recordingsCount}
      />

      {/* Main Content View Switcher */}
      <main id="app-main-content">
        {activeTab === 'landing' && (
          <LandingPage
            onStartRecording={() => setActiveTab('recorder')}
            onOpenExtensionTab={() => setActiveTab('extension')}
            onOpenPrivacyModal={() => setIsPrivacyModalOpen(true)}
            onOpenLibraryTab={() => setActiveTab('library')}
          />
        )}

        {activeTab === 'recorder' && (
          <RecorderApp onRecordingSaved={handleRecordingSaved} />
        )}

        {activeTab === 'library' && (
          <VideoLibrary
            onSelectRecording={(rec) => setActiveSelectedRecording(rec)}
            onRefreshTrigger={refreshTrigger}
          />
        )}

        {activeTab === 'extension' && <ExtensionStudio />}
      </main>

      {/* Video Player & Annotation Modal */}
      <VideoPlayerModal
        recording={activeSelectedRecording}
        onClose={() => setActiveSelectedRecording(null)}
      />

      {/* Privacy Guarantee Modal */}
      <PrivacyModal
        isOpen={isPrivacyModalOpen}
        onClose={() => setIsPrivacyModalOpen(false)}
      />
    </div>
  );
}
