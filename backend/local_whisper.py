import sys
import whisper
import os

# 保证输出中文不乱码
sys.stdout.reconfigure(encoding='utf-8')

# 获取脚本当前目录
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# 指定项目里的 ffmpeg.exe 路径
FFMPEG_PATH = os.path.join(BASE_DIR, 'ffmpeg', 'ffmpeg.exe')
os.environ["FFMPEG_BINARY"] = FFMPEG_PATH

# 获取传入的音频文件路径
if len(sys.argv) < 2:
    print("请提供音频文件路径")
    sys.exit(1)

audio_path = sys.argv[1]

# 加载 Whisper 模型（可改成 tiny/small/medium/large）
model = whisper.load_model("base")

# 执行转写
result = model.transcribe(audio_path, language="zh")

# 输出识别结果
print(result["text"])
