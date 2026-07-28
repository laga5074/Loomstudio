import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import ytdl from '@distube/ytdl-core';
import http from 'http';
import https from 'https';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Enable CORS headers for all API requests
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Range');
    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
      return;
    }
    next();
  });

// Helper to resolve raw social media/video URLs to direct playable MP4 streams
async function resolveDirectVideoMedia(rawUrl: string): Promise<string | null> {
  const url = rawUrl.trim();
  if (!url) return null;

  // Direct MP4 / media link
  if (url.match(/\.(mp4|webm|m3u8|mov|avi)(\?.*)?$/i) || url.includes('gtv-videos-bucket') || url.includes('googleapis.com') || url.startsWith('blob:')) {
    return url;
  }

  // Check YouTube match
  const ytMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/);
  const videoId = ytMatch ? ytMatch[1] : null;

  // Tier 1: Try Piped API instances for YouTube
  if (videoId) {
    const pipedInstances = [
      'https://pipedapi.kavin.rocks',
      'https://api.piped.video',
      'https://pipedapi.privacy.com.de',
      'https://pipedapi.lunar.icu',
      'https://pipedapi.tokhmi.xyz',
      'https://pipedapi.moomoo.me',
      'https://pipedapi.mha.fi'
    ];
    for (const inst of pipedInstances) {
      try {
        const pRes = await fetch(`${inst}/streams/${videoId}`, {
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
          signal: AbortSignal.timeout(3000)
        });
        if (pRes.ok) {
          const data: any = await pRes.json();
          if (data.videoStreams && data.videoStreams.length > 0) {
            const best = data.videoStreams.find((s: any) => s.mimeType?.includes('video/mp4') && (s.quality === '720p' || s.quality === '1080p'))
              || data.videoStreams.find((s: any) => s.mimeType?.includes('video/mp4'))
              || data.videoStreams[0];
            if (best && best.url) {
              return best.url;
            }
          }
        }
      } catch (e) {
        // try next
      }
    }
  }

  // Tier 2: Try Cobalt API for Social Media links (YouTube, TikTok, Instagram, Facebook)
  const cobaltInstances = [
    'https://api.cobalt.tools/api/json',
    'https://co.wuk.sh/api/json'
  ];
  for (const cInst of cobaltInstances) {
    try {
      const cRes = await fetch(cInst, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        body: JSON.stringify({
          url: url,
          videoQuality: '720',
        }),
        signal: AbortSignal.timeout(3500)
      });
      if (cRes.ok) {
        const cData: any = await cRes.json();
        if (cData.status === 'redirect' || cData.status === 'tunnel') {
          if (cData.url) return cData.url;
        }
        if (cData.status === 'picker' && cData.picker && cData.picker[0]?.url) {
          return cData.picker[0].url;
        }
      }
    } catch (e) {
      // try next
    }
  }

  // Tier 3: Try Invidious nodes if YouTube
  if (videoId) {
    const invidiousNodes = [
      'https://inv.tux.pizza',
      'https://invidious.nerdvpn.de',
      'https://yt.drgnz.club',
      'https://inv.nadeko.net',
      'https://invidious.flokinet.to'
    ];
    for (const node of invidiousNodes) {
      try {
        const nodeRes = await fetch(`${node}/api/v1/videos/${videoId}`, {
          headers: { 'User-Agent': 'Mozilla/5.0' },
          signal: AbortSignal.timeout(2500)
        });
        if (nodeRes.ok) {
          const data: any = await nodeRes.json();
          if (data.formatStreams && data.formatStreams.length > 0) {
            const stream = data.formatStreams.find((s: any) => s.qualityLabel === '720p' || s.qualityLabel === '1080p') || data.formatStreams[0];
            if (stream && stream.url) {
              return stream.url;
            }
          }
        }
      } catch (e) {
        // try next
      }
    }

    // Tier 4: Try ytdl-core
    try {
      const info = await ytdl.getInfo(`https://www.youtube.com/watch?v=${videoId}`);
      let format = ytdl.chooseFormat(info.formats, { quality: 'highest', filter: 'videoandaudio' });
      if (!format || !format.url) {
        format = ytdl.chooseFormat(info.formats, { quality: 'highestvideo' });
      }
      if (format && format.url) {
        return format.url;
      }
    } catch (e) {
      // fallback
    }
  }

  return null;
}

  // API 1: Resolve Video URL (YouTube, TikTok, Instagram, Facebook, MP4)
  app.get('/api/resolve-video', async (req, res) => {
    try {
      const videoUrl = (req.query.url as string || '').trim();
      if (!videoUrl) {
        res.status(400).json({ error: 'URL parameter required' });
        return;
      }

      // Check YouTube
      const ytMatch = videoUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/);
      const ytVideoId = ytMatch ? ytMatch[1] : null;

      // Check TikTok
      const tiktokMatch = videoUrl.match(/tiktok\.com\/(?:@[\w.-]+\/video\/|v\/)?(\d+)/);
      const tiktokId = tiktokMatch ? tiktokMatch[1] : null;

      // Check Instagram
      const igMatch = videoUrl.match(/instagram\.com\/(?:p|reel|tv)\/([A-Za-z0-9_-]+)/);
      const igCode = igMatch ? igMatch[1] : null;

      // Try direct media resolution
      const directMediaUrl = await resolveDirectVideoMedia(videoUrl);

      if (directMediaUrl) {
        res.json({
          type: 'direct',
          streamUrl: `/api/proxy-video?url=${encodeURIComponent(directMediaUrl)}`,
          embedUrl: ytVideoId ? `https://www.youtube.com/embed/${ytVideoId}?autoplay=1&mute=0&enablejsapi=1` : '',
          originalUrl: videoUrl,
        });
        return;
      }

      // Fallback embeds if direct media stream resolution failed or blocked
      if (ytVideoId) {
        res.json({
          type: 'youtube_embed',
          streamUrl: '',
          embedUrl: `https://www.youtube.com/embed/${ytVideoId}?autoplay=1&mute=0&enablejsapi=1`,
          originalUrl: videoUrl,
        });
        return;
      }

      if (igCode) {
        res.json({
          type: 'instagram_embed',
          streamUrl: '',
          embedUrl: `https://www.instagram.com/p/${igCode}/embed/`,
          originalUrl: videoUrl,
        });
        return;
      }

      if (tiktokId) {
        res.json({
          type: 'tiktok_embed',
          streamUrl: '',
          embedUrl: `https://www.tiktok.com/embed/v2/${tiktokId}`,
          originalUrl: videoUrl,
        });
        return;
      }

      if (videoUrl.includes('facebook.com') || videoUrl.includes('fb.watch')) {
        res.json({
          type: 'facebook_embed',
          streamUrl: '',
          embedUrl: `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(videoUrl)}&show_text=false`,
          originalUrl: videoUrl,
        });
        return;
      }

      // Generic fallback
      res.json({
        type: 'proxy',
        streamUrl: `/api/proxy-video?url=${encodeURIComponent(videoUrl)}`,
        embedUrl: '',
        originalUrl: videoUrl,
      });
    } catch (err: any) {
      console.error('Error resolving video:', err);
      res.status(500).json({ error: err.message || 'Failed to resolve video' });
    }
  });

  // API 2: Stream YouTube Video Directly with CORS (No redirects to prevent canvas taint)
  app.get('/api/stream-youtube', async (req, res) => {
    try {
      const videoId = (req.query.v as string || '').trim();
      if (!videoId) {
        res.status(400).send('Missing video ID');
        return;
      }

      const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;
      const directMediaUrl = await resolveDirectVideoMedia(youtubeUrl);
      if (directMediaUrl) {
        streamRemoteUrl(directMediaUrl, req, res);
        return;
      }

      // Fallback 3: Direct ytdl pipe stream
      res.setHeader('Content-Type', 'video/mp4');
      res.setHeader('Access-Control-Allow-Origin', '*');
      ytdl(youtubeUrl, { quality: 'highestvideo', filter: 'videoandaudio' }).pipe(res);
    } catch (err: any) {
      console.error('Error streaming YouTube:', err);
      res.status(500).send('Error streaming video');
    }
  });

  // Helper to proxy video streams with Range headers and CORS
  function streamRemoteUrl(targetUrl: string, req: express.Request, res: express.Response) {
    try {
      const parsedUrl = new URL(targetUrl);
      const httpModule = parsedUrl.protocol === 'https:' ? https : http;

      const headers: Record<string, string> = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      };

      if (req.headers.range) {
        headers['Range'] = req.headers.range;
      }

      const clientReq = httpModule.get(targetUrl, { headers }, (remoteRes) => {
        // Handle redirects internally (follow up to 3 redirects)
        if (remoteRes.statusCode && remoteRes.statusCode >= 300 && remoteRes.statusCode < 400 && remoteRes.headers.location) {
          streamRemoteUrl(remoteRes.headers.location, req, res);
          return;
        }

        res.statusCode = remoteRes.statusCode || 200;
        
        const allowedHeaders = ['content-type', 'content-length', 'content-range', 'accept-ranges'];
        allowedHeaders.forEach((h) => {
          if (remoteRes.headers[h]) {
            res.setHeader(h, remoteRes.headers[h] as string);
          }
        });

        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Range, Content-Type');

        remoteRes.pipe(res);
      });

      clientReq.on('error', (err) => {
        console.error('Stream proxy error:', err);
        if (!res.headersSent) {
          res.status(500).send('Stream proxy error');
        }
      });
    } catch (err: any) {
      console.error('Invalid stream target URL:', err);
      res.status(400).send('Invalid URL');
    }
  }

  // API 3: Proxy Video with CORS headers so canvas can record without taint
  app.get('/api/proxy-video', (req, res) => {
    const targetUrl = req.query.url as string;
    if (!targetUrl) {
      res.status(400).send('Missing target URL');
      return;
    }
    streamRemoteUrl(targetUrl, req, res);
  });

  // Serve Vite Dev Middleware or Static Production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
