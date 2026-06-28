import axios from 'axios';
import React, { ChangeEventHandler, useState, useRef, useEffect } from 'react';
import { X, ImagePlus } from 'lucide-react';
import { ISendExt } from '../types';


interface InputSendProps {
  onSend: (input: string, ext: ISendExt) => void;
  theme?: 'light' | 'dark';
}

const InputSend: React.FC<InputSendProps> = ({ onSend, theme = 'light' }) => {
  const [input, setInput] = useState('');

  const [previewImgUrl, setPreviewImgUrl] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = '1.5rem';
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    if (textareaRef.current) {
      const minHeight = 1.5 * 16;
      const maxHeight = 4.5 * 16;
      textareaRef.current.style.height = `${minHeight}px`;
      if (textareaRef.current.scrollHeight > textareaRef.current.clientHeight) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, maxHeight)}px`;
      }
    }
  };
  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (previewImgUrl) {
        onSend(input, { type: 'image_url', url: previewImgUrl });
      } else {
        onSend(input, { type: 'text'});
      }
      setInput('');
      setPreviewImgUrl('');
    }
  };

  const onCancel = () => {
    setPreviewImgUrl('');
  }

  const imgUploadHandler: ChangeEventHandler<HTMLInputElement> = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      // 是一张图片
      if (file.type.match("image.*")) {
        const formData = new FormData();
        // file.name
        // file.arrayBuffer().then(fileBuffer => {
        //   const b = new Blob();
        //   // b.
        //   const newF = new File(new Blob(), encodeURI(file.name), {type: file.type})
        // })
        formData.append('file', file);
        axios.post('/api/upload/single', formData, {
          // 关键：设置正确的请求头（让浏览器自动生成 boundary）
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          // 可选：监听上传进度
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round(
              (progressEvent?.loaded * 100) / (progressEvent?.total || 1)
            );
            console.log(`上传进度：${percentCompleted}%`);
          },
        }).then((data) => {
          if (data) {
            console.log(data.data.data.url);
            setPreviewImgUrl(data.data.data.url);
            // previewImgRef.current!.src = data.data.url;
            
          }
        }).catch((error) => {
          console.log(error);
        });
      }
    }
  }

  return (
    <div className="flex-col flex">
      <div className="flex relative" style={{display: previewImgUrl ? 'flex' : 'none'}}>
        <div className="relative">
          <img className={`w-20 h-20 object-cover rounded-lg border-2 shadow-sm ${
            theme === 'dark' ? 'border-gray-600' : 'border-gray-200'
          }`} src={previewImgUrl} alt='' />
          <button
            onClick={onCancel}
            className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 shadow-md transition-colors duration-200"
            type="button"
          >
            <X size={14} />
          </button>
        </div>
      </div>
      <div className={`flex items-center border rounded-lg p-2 shadow-sm ${
        theme === 'dark' ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-300'
      }`}>
        <textarea
          ref={textareaRef}
          value={input}
          name='text'
          onChange={handleChange}
          onKeyDown={handleKeyPress}
          className={`flex-1 mr-2 border-none outline-none resize-none overflow-y-auto max-h-[4.5rem] ${
            theme === 'dark'
              ? 'bg-gray-800 text-white placeholder-gray-400'
              : 'bg-white text-gray-900 placeholder-gray-500'
          }`}
          placeholder="输入消息..."
        />
        <div>
          <label id="imgUP" className={`cursor-pointer flex items-center justify-center w-8 h-8 rounded-full transition-colors duration-200 ${
            theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
          }`}>
            <ImagePlus size={20} className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} />
            <input className='hidden' name='imgUP' accept='image/*' type="file" onChange={imgUploadHandler} />
          </label>
        </div>
      </div>
      {/* <button onClick={onClick} className="bg-blue-500 hover:bg-blue-600 text-white px-4 rounded">
        发送
      </button> */}
    </div>
  );
};

export default InputSend;