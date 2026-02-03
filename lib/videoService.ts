interface VideoPlayerConfig {
  playbackId: string;
  onReady?: () => void;
  onError?: (error: any) => void;
  onRetry?: () => void;
}

class VideoService {
  private retryCount = 0;
  private maxRetries = 3;

  async initializePlayer(config: VideoPlayerConfig): Promise<boolean> {
    try {
      if (!this.isValidPlaybackId(config.playbackId)) {
        throw new Error('Invalid playback ID');
      }

      const networkHealthy = await this.checkNetworkHealth();
      if (!networkHealthy) {
        throw new Error('Poor network conditions');
      }

      config.onReady?.();
      return true;
         
    } catch (error) {
      return this.handleError(error, config);
    }
  }

  private async handleError(error: any, config: VideoPlayerConfig): Promise<boolean> {
    console.warn('Video service error:', error);
         
    if (this.retryCount < this.maxRetries) {
      this.retryCount++;
      const delay = Math.pow(2, this.retryCount) * 1000; // 2s, 4s, 8s
             
      setTimeout(() => {
        config.onRetry?.();
        this.initializePlayer(config);
      }, delay);
             
      return false;
    }

    
    config.onError?.(error);
    return false;
  }

  private isValidPlaybackId(playbackId: string): boolean {
    return !!playbackId && playbackId.length > 10; 
  }

  private async checkNetworkHealth(): Promise<boolean> {
    
    return navigator.onLine;
  }
}

export const videoService = new VideoService();