$(function () {
    console.log("Script starting...");

    const playerTrack = $("#player-track");
    const bgArtwork = $("#player-bg-artwork");
    const albumName = $("#album-name");
    const trackName = $("#track-name");
    const albumArt = $("#album-art");
    const sArea = $("#seek-bar-container");
    const seekBar = $("#seek-bar");
    const trackTime = $("#track-time");
    const seekTime = $("#seek-time");
    const sHover = $("#s-hover");
    const playPauseButton = $("#play-pause-button");
    const tProgress = $("#current-time");
    const tTime = $("#track-length");
    const i = playPauseButton.find("i");

    // 🟢 ADD THIS: New play count element reference
    const playCountEl = $("#play-count");
    let playCount = 0;

    let seekT, seekLoc, seekBarPos, cM, ctMinutes, ctSeconds;
    let curMinutes, curSeconds, durMinutes, durSeconds;
    let playProgress, bTime, nTime = 0, buffInterval = null, tFlag = false;

    let audio = null;
    let wakeLock = null;
    let audioInitialized = false;

    function updatePlayCount() {
    playCount++;
    playCountEl.text(`Plays: ${playCount}`);
    }
    
    function playPause() {
        if (!audio) {
            alert("Audio not loaded yet.");
            return;
        }

        setTimeout(function () {
            if (audio.paused) {
                playerTrack.addClass("active");
                albumArt.addClass("active");
                checkBuffering();
                i.attr("class", "fas fa-pause");

                const playPromise = audio.play();
                if (playPromise !== undefined) {
                    playPromise.then(() => {
                        console.log("✓ Play successful");
                        updatePlayCount();
                    }).catch(error => {
                        console.log("✗ Play failed:", error);
                        alert("Can't play: " + error.message);
                        playerTrack.removeClass("active");
                        albumArt.removeClass("active");
                        clearInterval(buffInterval);
                        albumArt.removeClass("buffering");
                        i.attr("class", "fas fa-play");
                    });
                }
            } else {
                playerTrack.removeClass("active");
                albumArt.removeClass("active");
                clearInterval(buffInterval);
                albumArt.removeClass("buffering");
                i.attr("class", "fas fa-play");
                audio.pause();
            }
        }, 300);
    }

    // ... showHover, hideHover, playFromClickedPos functions stay the same ...

    function updateCurrTime() {
        nTime = new Date().getTime();
        if (!tFlag) {
            tFlag = true;
            trackTime.addClass("active");
        }

        curMinutes = Math.floor(audio.currentTime / 60);
        curSeconds = Math.floor(audio.currentTime - curMinutes * 60);
        durMinutes = Math.floor(audio.duration / 60);
        durSeconds = Math.floor(audio.duration - durMinutes * 60);

        playProgress = (audio.currentTime / audio.duration) * 100;

        tProgress.text(`${pad(curMinutes)}:${pad(curSeconds)}`);
        tTime.text(`${pad(durMinutes)}:${pad(durSeconds)}`);
        seekBar.width(playProgress + "%");

        if (playProgress === 100) {
            i.attr("class", "fas fa-play");
            seekBar.width(0);
            tProgress.text("00:00");
            albumArt.removeClass("buffering active");
            clearInterval(buffInterval);
        }
    }

    // ... pad and checkBuffering functions stay the same ...

    function initPlayer() {
        console.log("Initializing audio...");

        audio = new Audio("https://raw.githubusercontent.com/parmin84/audio-player/main/episode_1_sped_up%20(1).mp3");
        audio.loop = false;
        audio.preload = 'metadata';
        audio.crossOrigin = 'anonymous';

        albumName.text("General Recommendations");
        trackName.text("Anticancer.ca");

        albumArt.find("img.active").removeClass("active");
        $("#_1").addClass("active");

        const bgArtworkUrl = $("#_1").attr("src");
        bgArtwork.css({ "background-image": "url(" + bgArtworkUrl + ")" });

        sArea.mousemove(showHover);
        sArea.mouseout(hideHover);
        sArea.on("click", playFromClickedPos);

        $(audio).on("timeupdate", updateCurrTime);
        $(audio).on("loadedmetadata", () => {
            setupMediaSession();
            setupWakeLock();
        });

        $(audio).on("play", () => {
            if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'playing';
        });
        
        $(audio).on("pause", () => {
            if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'paused';
        });

        console.log("Player ready.");
    }

    // ... rest of your functions stay exactly the same ...
});

    function setupMediaSession() {
        if (!('mediaSession' in navigator)) return;

        navigator.mediaSession.metadata = new MediaMetadata({
            title: trackName.text() || 'Audio Track',
            artist: albumName.text() || 'Unknown Artist',
            album: 'Audio Player',
            artwork: [96, 128, 192, 256, 384, 512].map(size => ({
                src: $('#_1').attr('src'),
                sizes: `${size}x${size}`,
                type: 'image/jpeg'
            }))
        });

        navigator.mediaSession.setActionHandler('play', () => {
            audio.play();
        });

        navigator.mediaSession.setActionHandler('pause', () => {
            audio.pause();
        });

        navigator.mediaSession.setActionHandler('seekbackward', (details) => {
            const skip = details.seekOffset || 10;
            audio.currentTime = Math.max(audio.currentTime - skip, 0);
        });

        navigator.mediaSession.setActionHandler('seekforward', (details) => {
            const skip = details.seekOffset || 10;
            audio.currentTime = Math.min(audio.currentTime + skip, audio.duration);
        });

        navigator.mediaSession.setActionHandler('seekto', (details) => {
            if (details.fastSeek && 'fastSeek' in audio) {
                audio.fastSeek(details.seekTime);
            } else {
                audio.currentTime = details.seekTime;
            }
        });

        function updatePositionState() {
            if (audio.duration && !isNaN(audio.duration)) {
                navigator.mediaSession.setPositionState({
                    duration: audio.duration,
                    playbackRate: audio.playbackRate,
                    position: audio.currentTime
                });
            }
        }

        audio.addEventListener('timeupdate', updatePositionState);
        audio.addEventListener('durationchange', updatePositionState);
        audio.addEventListener('ratechange', updatePositionState);
    }

    async function setupWakeLock() {
        try {
            if ('wakeLock' in navigator) {
                wakeLock = await navigator.wakeLock.request('screen');
                console.log("Wake lock active");
            }
        } catch (err) {
            console.log("Wake lock error:", err);
        }
    }

    function releaseWakeLock() {
        if (wakeLock) {
            wakeLock.release();
            wakeLock = null;
            console.log("Wake lock released");
        }
    }

    $("#speed-control").on("change", function () {
        if (audio) {
            audio.playbackRate = parseFloat(this.value);
        }
    });

    // Lazy initialize on first tap
    playPauseButton.off('click').on("click touchstart", function (e) {
        e.preventDefault();
        console.log("Button clicked/touched!");

        if (!audioInitialized) {
            initPlayer();
            audioInitialized = true;
        }

        playPause();
    });
});
