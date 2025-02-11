import "./index.css";
import logo from "./assets/logo.png";
import React from "react";
import SoundBar from "./components/SoundBar";
import {
  BsDownload,
  BsFillSuitHeartFill,
  BsPlayBtnFill,
  BsStopBtnFill,
} from "react-icons/bs";
import ScorderHeader from "./views/ScorderHeader.js";
import ScorderRecordComponent from "./views/ScorderRecordComponent.js";


export default function App() {
  const [dow, setDow] = React.useState("none");
  const [stop, setStop] = React.useState(true);
  const [rec, setRec] = React.useState(false);
  const [sb, setSb] = React.useState(false);
  const [prev, setPrev] = React.useState();

  const [videoElement, setVideoElement] = React.useState(null);
  const [downloadLink, setDownloadLink] = React.useState(null);

  const [mr, setMr] = React.useState(null);

  React.useEffect(() => {
    const videoElement1 = document.getElementsByTagName("video")[0];
    setVideoElement(videoElement1);
    const downloadLink1 = document.getElementById("download");
    setDownloadLink(downloadLink1);
  }, []);

  function startRecord() {
    setRec(true);
    setStop(false);
    setDow("none");
  }

  function stopRecord() {
    setRec(false);
    setStop(true);
    setDow("inline");
  }

  const audioRecordConstraints = {
    echoCancellation: true,
  };

  const handleRecord = function ({ stream, mimeType }) {
    startRecord();
    let recordedChunks = [];
    const mediaRecorder = new MediaRecorder(stream);
    setMr(mediaRecorder);

    mediaRecorder.ondataavailable = function (e) {
      if (e.data.size > 0) {
        recordedChunks.push(e.data);
      }
    };

    mediaRecorder.onstop = function () {
      const blob = new Blob(recordedChunks, {
        type: mimeType,
      });
      recordedChunks = [];
      const filename = window.prompt("Enter file name");
      downloadLink.href = URL.createObjectURL(blob);
      setPrev(URL.createObjectURL(blob));
      downloadLink.download = `${filename || "recording"}.webm`;
      stopRecord();
      var tracks = mediaRecorder.stream.getTracks();
      tracks.forEach((track) => {
        track.stop();
      });
      videoElement.srcObject = null;
    };

    mediaRecorder.start(200);
  };

  async function recordAudio() {
    const mimeType = "audio/webm";
    navigator.mediaDevices
      .getUserMedia({
        audio: audioRecordConstraints,
      })
      .then(function (stream) {
        handleRecord({ stream, mimeType });
      });
  }

  async function recordVideo() {
    const mimeType = "video/webm";
    const constraints = {
      audio: {
        echoCancellation: true,
      },
      video: {
        width: {
          min: 640,
          max: 1024,
        },
        height: {
          min: 480,
          max: 768,
        },
      },
    };
    navigator.mediaDevices.getUserMedia(constraints).then((stream) => {
      videoElement.srcObject = stream;
      handleRecord({ stream, mimeType });
    });
  }

  const previewRecording = () => {
    videoElement.src = prev;
    videoElement.controls = true;
    videoElement.load();
  };

  async function recordScreen() {
    const mimeType = "video/webm";
    const constraints = {
      video: {
        cursor: "motion",
      },
    };
    if (!(navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia)) {
      return window.alert("Screen Record not supported!");
    }

    let stream = null;

    const displayStream = await navigator.mediaDevices.getDisplayMedia({
      video: { cursor: "motion" },
      audio: { echoCancellation: true },
    });

    const voiceStream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true },
      video: false,
    });

    const audioTrackAvailable =
      displayStream.getAudioTracks().length === 0 ? false : true;

    const audioContext = new AudioContext();
    const audioIn01 = !audioTrackAvailable
      ? null
      : audioContext.createMediaStreamSource(displayStream);
    const audioIn02 = audioContext.createMediaStreamSource(voiceStream);
    const audioDestination = audioContext.createMediaStreamDestination();

    !audioTrackAvailable ? null : audioIn01.connect(audioDestination);
    audioIn02.connect(audioDestination);

    const tracks = [
      ...displayStream.getVideoTracks(),
      ...audioDestination?.stream?.getTracks(),
    ];

    stream = new MediaStream(tracks);

    handleRecord({ stream, mimeType });
    videoElement.srcObject = stream;
  }

  return (
    <div>
      <ScorderHeader />
      <ScorderRecordComponent />
    </div>
  );
}
