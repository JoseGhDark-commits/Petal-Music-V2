  class MusicPlayer {
      constructor() {
        this.playlist = [];
        this.currentIndex = -1;
        this.isPlaying = false;
        this.audio = document.getElementById('audioPlayer');
        this.initializeElements();
        this.setupEventListeners();
      }

      initializeElements() {
        this.dropZone = document.getElementById('dropZone');
        this.fileInput = document.getElementById('fileInput');
        this.playlistEl = document.getElementById('playlist');
        this.songCountEl = document.getElementById('songCount');
        this.currentSongEl = document.getElementById('currentSong');
        this.currentArtistEl = document.getElementById('currentArtist');
        this.albumArt = document.getElementById('albumArt');
        this.playPauseBtn = document.getElementById('playPauseBtn');
        this.prevBtn = document.getElementById('prevBtn');
        this.nextBtn = document.getElementById('nextBtn');
        this.progressBar = document.getElementById('progressBar');
        this.progressFill = document.getElementById('progressFill');
        this.currentTimeEl = document.getElementById('currentTime');
        this.totalTimeEl = document.getElementById('totalTime');
        this.volumeSlider = document.getElementById('volumeSlider');
        this.volumeIcon = document.getElementById('volumeIcon');
        this.metadataModal = document.getElementById('metadataModal');
        this.metadataGrid = document.getElementById('metadataGrid');
        this.metadataBtn = document.getElementById('metadataBtn');
      }

      setupEventListeners() {
        this.dropZone.addEventListener('dragover', this.handleDragOver.bind(this));
        this.dropZone.addEventListener('dragleave', this.handleDragLeave.bind(this));
        this.dropZone.addEventListener('drop', this.handleDrop.bind(this));
        this.fileInput.addEventListener('change', this.handleFileSelect.bind(this));
        this.playPauseBtn.addEventListener('click', this.togglePlayPause.bind(this));
        this.prevBtn.addEventListener('click', this.previousSong.bind(this));
        this.nextBtn.addEventListener('click', this.nextSong.bind(this));
        this.audio.addEventListener('timeupdate', this.updateProgress.bind(this));
        this.audio.addEventListener('ended', this.nextSong.bind(this));
        this.audio.addEventListener('loadedmetadata', this.updateDuration.bind(this));
        this.progressBar.addEventListener('click', this.seekTo.bind(this));
        this.volumeSlider.addEventListener('input', this.updateVolume.bind(this));
        this.audio.volume = 0.5;

        this.metadataModal.addEventListener('click', (e) => {
          if (e.target === this.metadataModal) {
            this.hideMetadata();
          }
        });

        document.addEventListener('keydown', (e) => {
          if (e.code === 'Space' && !e.target.matches('input')) {
            e.preventDefault();
            this.togglePlayPause();
          }
        });
      }

      handleDragOver(e) {
        e.preventDefault();
        this.dropZone.classList.add('dragover');
      }

      handleDragLeave(e) {
        e.preventDefault();
        this.dropZone.classList.remove('dragover');
      }

      handleDrop(e) {
        e.preventDefault();
        this.dropZone.classList.remove('dragover');
        const files = Array.from(e.dataTransfer.files);
        this.addFiles(files);
      }

      handleFileSelect(e) {
        const files = Array.from(e.target.files);
        this.addFiles(files);
        this.fileInput.value = '';
      }

      async addFiles(files) {
        const audioFiles = files.filter(file => file.type.startsWith('audio/'));
        for (const file of audioFiles) {
          const metadata = await this.extractMetadata(file);
          const song = {
            id: Date.now() + Math.random(),
            file: file,
            name: metadata.title || file.name.replace(/\.[^/.]+$/, ""),
            artist: metadata.artist || 'Artista desconocido',
            album: metadata.album || 'Álbum desconocido',
            duration: 0,
            url: URL.createObjectURL(file),
            metadata: metadata
          };
          this.playlist.push(song);
        }
        this.updatePlaylist();
        this.updateSongCount();
      }

      async extractMetadata(file) {
        return new Promise((resolve) => {
          window.jsmediatags.read(file, {
            onSuccess: (tag) => {
              const metadata = {
                title: tag.tags.title,
                artist: tag.tags.artist,
                album: tag.tags.album,
                picture: tag.tags.picture,
                duration: 0,
                size: this.formatFileSize(file.size),
                format: file.type,
                bitrate: 'N/A',
                sampleRate: 'N/A',
                filename: file.name,
                lastModified: new Date(file.lastModified).toLocaleString('es-ES')
              };
              resolve(metadata);
            },
            onError: () => {
              resolve({
                title: '',
                artist: '',
                album: '',
                picture: null,
                duration: 0,
                size: this.formatFileSize(file.size),
                format: file.type,
                bitrate: 'N/A',
                sampleRate: 'N/A',
                filename: file.name,
                lastModified: new Date(file.lastModified).toLocaleString('es-ES')
              });
            }
          });
        });
      }

      formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
      }

      updatePlaylist() {
        if (this.playlist.length === 0) {
          this.playlistEl.innerHTML = '<div class="empty-playlist"><p>No hay canciones en tu playlist</p></div>';
          return;
        }

        this.playlistEl.innerHTML = this.playlist.map((song, index) => {
          let albumArtHtml = '<div class="song-icon"><span class="music-note-icon"></span></div>';
          if (song.metadata.picture) {
            const { data, format } = song.metadata.picture;
            const base64String = data.reduce((acc, byte) => acc + String.fromCharCode(byte), '');
            albumArtHtml = `<div class="song-icon"><img src="data:${format};base64,${window.btoa(base64String)}" alt="Carátula del álbum"></div>`;
          }
          return `
            <div class="song-item ${index === this.currentIndex ? 'playing' : ''}" data-index="${index}">
              <div class="song-info">
                ${albumArtHtml}
                <div class="song-details">
                  <div class="song-title">${song.name}</div>
                  <div class="song-meta">
                    <span>${song.artist}</span>
                    <span>•</span>
                    <span>${this.formatTime(song.duration)}</span>
                  </div>
                </div>
              </div>
              <div class="song-actions">
                <button class="action-btn" onclick="player.showSongMetadata(${index})" title="Ver información"><span class="info-icon"></span></button>
                <button class="action-btn" onclick="player.removeSong(${index})" title="Eliminar"><span class="delete-icon"></span></button>
              </div>
            </div>
          `;
        }).join('');
        document.querySelectorAll('.song-info').forEach(el => {
          el.addEventListener('click', () => {
            const index = parseInt(el.closest('.song-item').dataset.index);
            this.playSong(index);
          });
        });
      }

      updateSongCount() {
        this.songCountEl.textContent = `${this.playlist.length} canción${this.playlist.length !== 1 ? 'es' : ''}`;
      }

      playSong(index) {
        if (index < 0 || index >= this.playlist.length) return;
        this.currentIndex = index;
        const song = this.playlist[index];
        this.audio.src = song.url;
        this.audio.load();
        this.audio.play();
        this.isPlaying = true;
        this.currentSongEl.textContent = song.name;
        this.currentArtistEl.textContent = song.artist;
        this.playPauseBtn.innerHTML = '<span class="pause-icon"></span>';
        if (song.metadata.picture) {
          const { data, format } = song.metadata.picture;
          const base64String = data.reduce((acc, byte) => acc + String.fromCharCode(byte), '');
          this.albumArt.innerHTML = `<img src="data:${format};base64,${window.btoa(base64String)}" alt="Carátula del álbum">`;
        } else {
          this.albumArt.innerHTML = '<span class="music-note-icon"></span>';
        }
        this.albumArt.classList.add('playing');
        this.updatePlaylist();
        this.updateVolumeIcon();
      }

      togglePlayPause() {
        if (this.playlist.length === 0) return;
        if (this.currentIndex === -1) {
          this.playSong(0);
          return;
        }
        if (this.isPlaying) {
          this.audio.pause();
          this.playPauseBtn.innerHTML = '<span class="play-icon"></span>';
          this.albumArt.classList.remove('playing');
        } else {
          this.audio.play();
          this.playPauseBtn.innerHTML = '<span class="pause-icon"></span>';
          this.albumArt.classList.add('playing');
        }
        this.isPlaying = !this.isPlaying;
      }

      previousSong() {
        if (this.playlist.length === 0) return;
        const prevIndex = this.currentIndex > 0 ? this.currentIndex - 1 : this.playlist.length - 1;
        this.playSong(prevIndex);
      }

      nextSong() {
        if (this.playlist.length === 0) return;
        const nextIndex = this.currentIndex < this.playlist.length - 1 ? this.currentIndex + 1 : 0;
        this.playSong(nextIndex);
      }

      removeSong(index) {
        if (index < 0 || index >= this.playlist.length) return;
        URL.revokeObjectURL(this.playlist[index].url);
        if (index === this.currentIndex) {
          this.audio.pause();
          this.isPlaying = false;
          this.playPauseBtn.innerHTML = '<span class="play-icon"></span>';
          this.albumArt.classList.remove('playing');
          if (this.playlist.length === 1) {
            this.currentIndex = -1;
            this.currentSongEl.textContent = 'Ninguna canción seleccionada';
            this.currentArtistEl.textContent = '';
          } else if (index < this.playlist.length - 1) {
            this.playlist.splice(index, 1);
            this.playSong(index);
            this.updatePlaylist();
            this.updateSongCount();
            return;
          } else {
            this.playlist.splice(index, 1);
            this.playSong(index - 1);
            this.updatePlaylist();
            this.updateSongCount();
            return;
          }
        } else if (index < this.currentIndex) {
          this.currentIndex--;
        }
        this.playlist.splice(index, 1);
        this.updatePlaylist();
        this.updateSongCount();
      }

      updateProgress() {
        if (this.audio.duration) {
          const progress = (this.audio.currentTime / this.audio.duration) * 100;
          this.progressFill.style.width = `${progress}%`;
          this.currentTimeEl.textContent = this.formatTime(this.audio.currentTime);
        }
      }

      updateDuration() {
        if (this.audio.duration) {
          this.totalTimeEl.textContent = this.formatTime(this.audio.duration);
          if (this.currentIndex >= 0) {
            this.playlist[this.currentIndex].duration = this.audio.duration;
            this.updatePlaylist();
          }
        }
      }

      seekTo(e) {
        if (this.audio.duration) {
          const rect = this.progressBar.getBoundingClientRect();
          const clickX = e.clientX - rect.left;
          const progress = clickX / rect.width;
          this.audio.currentTime = progress * this.audio.duration;
        }
      }

      updateVolume() {
        const volume = this.volumeSlider.value / 100;
        this.audio.volume = volume;
        this.volumeSlider.style.setProperty('--volume-width', `${this.volumeSlider.value}%`);
        
        this.updateVolumeIcon();
      }

      updateVolumeIcon() {
        const volume = this.audio.volume;
        if (volume === 0) {
          this.volumeIcon.innerHTML = '<span class="volume-mute-icon"></span>';
        } else {
          this.volumeIcon.innerHTML = '<span class="volume-high-icon"></span>';
        }
      }

      showMetadata() {
        if (this.currentIndex >= 0) {
          this.showSongMetadata(this.currentIndex);
        }
      }

      showSongMetadata(index) {
        if (index < 0 || index >= this.playlist.length) return;
        const song = this.playlist[index];
        const metadata = song.metadata;
        let albumArtHtml = '<div class="metadata-item"><div class="metadata-label">Carátula</div><div class="metadata-value">No disponible</div></div>';
        if (metadata.picture) {
          const { data, format } = metadata.picture;
          const base64String = data.reduce((acc, byte) => acc + String.fromCharCode(byte), '');
          albumArtHtml = `
            <div class="metadata-item">
              <div class="metadata-label">Carátula</div>
              <div class="metadata-value">
                <img src="data:${format};base64,${window.btoa(base64String)}" alt="Carátula del álbum" class="metadata-album-art">
              </div>
            </div>
          `;
        }
        this.metadataGrid.innerHTML = `
          <div class="metadata-item">
            <div class="metadata-label">Título</div>
            <div class="metadata-value">${song.name}</div>
          </div>
          <div class="metadata-item">
            <div class="metadata-label">Artista</div>
            <div class="metadata-value">${song.artist}</div>
          </div>
          <div class="metadata-item">
            <div class="metadata-label">Álbum</div>
            <div class="metadata-value">${song.album}</div>
          </div>
          ${albumArtHtml}
          <div class="metadata-item">
            <div class="metadata-label">Duración</div>
            <div class="metadata-value">${this.formatTime(song.duration)}</div>
          </div>
          <div class="metadata-item">
            <div class="metadata-label">Tamaño</div>
            <div class="metadata-value">${metadata.size}</div>
          </div>
          <div class="metadata-item">
            <div class="metadata-label">Formato</div>
            <div class="metadata-value">${metadata.format}</div>
          </div>
          <div class="metadata-item">
            <div class="metadata-label">Nombre del archivo</div>
            <div class="metadata-value">${metadata.filename}</div>
          </div>
          <div class="metadata-item">
            <div class="metadata-label">Última modificación</div>
            <div class="metadata-value">${metadata.lastModified}</div>
          </div>
        `;
        this.metadataModal.classList.add('show');
      }

      hideMetadata() {
        this.metadataModal.classList.remove('show');
      }

      formatTime(seconds) {
        if (isNaN(seconds) || seconds === 0) return '0:00';
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
      }
    }

    const player = new MusicPlayer();