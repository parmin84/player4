$(function () {
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

    let seekT,
        seekLoc,
        seekBarPos,
        cM,
        ctMinutes,
        ctSeconds,
        curMinutes,
        curSeconds,
        durMinutes,
        durSeconds,
        playProgress,
        bTime,
        nTime = 0,
        buffInterval = null,
        tFlag = false;

    let audio;

    function playPause() {
        setTimeout(function () {
            if (audio.paused) {
                playerTrack.addClass("active");
                albumArt.addClass("active");
                checkBuffering();
                i.attr("class", "fas fa-pause");
                audio.play();
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

    function showHover(event) {
        seekBarPos = sArea.offset();
        seekT = event.clientX - seekBarPos.left;
        seekLoc = audio.duration * (seekT / sArea.outerWidth());

        sHover.width(seekT);

        cM = seekLoc / 60;

        ctMinutes = Math.floor(cM);
        ctSeconds = Math.floor(seekLoc - ctMinutes * 60);

        if (ctMinutes < 0 || ctSeconds < 0) return;

        if (ctMinutes < 10) ctMinutes = "0" + ctMinutes;
        if (ctSeconds < 10) ctSeconds = "0" + ctSeconds;

        if (isNaN(ctMinutes) || isNaN(ctSeconds)) seekTime.text("--:--");
        else seekTime.text(ctMinutes + ":" + ctSeconds);

        seekTime.css({ left: seekT, "margin-left": "-21px" }).fadeIn(0);
    }

    function hideHover() {
        sHover.width(0);
        seekTime
            .text("00:00")
            .css({ left: "0px", "margin-left": "0px" })
            .fadeOut(0);
    }

    function playFromClickedPos() {
        audio.currentTime = seekLoc;
        seekBar.width(seekT);
        hideHover();
    }

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

        if (curMinutes < 10) curMinutes = "0" + curMinutes;
        if (curSeconds < 10) curSeconds = "0" + curSeconds;
        if (durMinutes < 10) durMinutes = "0" + durMinutes;
        if (durSeconds < 10) durSeconds = "0" + durSeconds;

        tProgress.text(isNaN(curMinutes) ? "00:00" : `${curMinutes}:${curSeconds}`);
        tTime.text(isNaN(durMinutes) ? "00:00" : `${durMinutes}:${durSeconds}`);

        if (
            isNaN(curMinutes) ||
            isNaN(curSeconds) ||
            isNaN(durMinutes) ||
            isNaN(durSeconds)
        ) {
            trackTime.removeClass("active");
        } else {
            trackTime.addClass("active");
        }

        seekBar.width(playProgress + "%");

        if (playProgress === 100) {
            i.attr("class", "fas fa-play");
            seekBar.width(0);
            tProgress.text("00:00");
            albumArt.removeClass("buffering active");
            clearInterval(buffInterval);
        }
    }

    function checkBuffering() {
        clearInterval(buffInterval);
        buffInterval = setInterval(function () {
            if (nTime === 0 || bTime - nTime > 1000) {
                albumArt.addClass("buffering");
            } else {
                albumArt.removeClass("buffering");
            }

            bTime = new Date().getTime();
        }, 100);
    }

    function initPlayer() {
        audio = new Audio();
        audio.src = "https://raw.githubusercontent.com/parmin84/audio-player/main/11labs_studio.mp3";
        audio.loop = false;

        // Set track info manually
        albumName.text("General Recommendations");
        trackName.text("Anticancer.ca");

        albumArt.find("img.active").removeClass("active");
        $("#_1").addClass("active");

        const bgArtworkUrl = $("#_1").attr("src");
        bgArtwork.css({ "background-image": "url(" + bgArtworkUrl + ")" });

        playPauseButton.on("click", playPause);
        sArea.mousemove(showHover);
        sArea.mouseout(hideHover);
        sArea.on("click", playFromClickedPos);

        $(audio).on("timeupdate", updateCurrTime);
    }

    initPlayer();

    // Playback speed control
    const speedControl = $("#speed-control");
    speedControl.on("change", function () {
        if (audio) {
            audio.playbackRate = parseFloat(this.value);
        }
    });
});