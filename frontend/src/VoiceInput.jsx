import React, { useState, useRef } from 'react';

export default function VoiceInput({ onResult, placeholder = '点击说话或输入...' }) {
  const [listening, setListening] = useState(false);
  const [text, setText] = useState('');
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const toggleRecording = async () => {
    if (listening) {
      // 停止录音
      mediaRecorderRef.current.stop();
      setListening(false);
    } else {
      // 开始录音
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);

      audioChunksRef.current = [];
      recorder.ondataavailable = (e) => {
        audioChunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const formData = new FormData();
        formData.append('audio', blob, 'recording.webm');

        try {
          const res = await fetch('http://localhost:4000/api/asr', {
            method: 'POST',
            body: formData,
          });
          const data = await res.json();
          if (data.text) {
            console.log('✅ 识别结果:', data.text);
            setText(data.text);
            onResult && onResult(data.text);
          } else {
            alert('未识别到语音');
          }
        } catch (err) {
          console.error('❌ 上传错误:', err);
          alert('语音识别失败');
        }
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setListening(true);
    }
  };

  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={placeholder}
        style={{ flex: 1, padding: 8 }}
      />
      <button onClick={toggleRecording}>
        {listening ? '🛑 停止录音' : '🎙️ 开始录音'}
      </button>
      <button onClick={() => onResult && onResult(text)}>提交</button>
    </div>
  );
}


