import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';
import ffprobePath from 'ffprobe-static';

ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath.path);  // ⚠ 注意 .path


ffmpeg('E:\\nju\\dayuyan\\ai-travel-planner\\backend\\uploads\\1761303762630_converted.wav')
  .ffprobe((err, data) => {
    if (err) return console.error(err);
    const stream = data.streams.find(s => s.codec_type === 'audio');
    console.log('采样率:', stream.sample_rate);
    console.log('声道数:', stream.channels);
  });
