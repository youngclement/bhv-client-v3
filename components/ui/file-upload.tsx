'use client';

import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Upload, 
  X, 
  Link, 
  Volume2, 
  Play, 
  Pause,
  Image as ImageIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AudioUploadProps {
  value?: string;
  onChange: (value: string) => void;
  onFileChange?: (file: File | null) => void;
  selectedFile?: File | null;
  className?: string;
}

export function AudioUpload({ value, onChange, onFileChange, selectedFile, className }: AudioUploadProps) {
  const [urlInput, setUrlInput] = useState(value || '');
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioRef, setAudioRef] = useState<HTMLAudioElement | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      // Chỉ lưu file, không upload ngay
      if (onFileChange) {
        onFileChange(file);
      }
      // Tạo URL tạm thời để preview
      const fileUrl = URL.createObjectURL(file);
      onChange(fileUrl);
    }
  }, [onChange, onFileChange]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'audio/*': ['.mp3', '.wav', '.ogg', '.m4a', '.aac']
    },
    maxFiles: 1
  });

  const handleUrlSubmit = () => {
    if (urlInput.trim()) {
      onChange(urlInput.trim());
    }
  };

  const handleRemove = () => {
    if (onFileChange) {
      onFileChange(null);
    }
    setUrlInput('');
    onChange('');
    if (audioRef) {
      audioRef.pause();
      setIsPlaying(false);
    }
  };

  const togglePlay = () => {
    if (!value) return;
    
    if (!audioRef) {
      const audio = new Audio(value);
      audio.onended = () => setIsPlaying(false);
      audio.onerror = () => {
        console.error('Error playing audio');
        setIsPlaying(false);
      };
      setAudioRef(audio);
      audio.play();
      setIsPlaying(true);
    } else {
      if (isPlaying) {
        audioRef.pause();
        setIsPlaying(false);
      } else {
        audioRef.play();
        setIsPlaying(true);
      }
    }
  };

  return (
    <Card className={cn('w-full', className)}>
      <CardContent className="p-6">
        <Label className="text-base font-medium">Audio File</Label>
        
        {value && (
          <div className="mt-4 flex items-center justify-between rounded-lg border p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Volume2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">Audio file selected</p>
                <p className="text-sm text-muted-foreground">
                  {selectedFile ? selectedFile.name : 'Audio URL'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={togglePlay}
                disabled={!value}
              >
                {isPlaying ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRemove}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        <Tabs defaultValue="upload" className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload">Upload File</TabsTrigger>
            <TabsTrigger value="url">Audio URL</TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="mt-4">
            <div
              {...getRootProps()}
              className={cn(
                'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
                isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
              )}
            >
              <input {...getInputProps()} />
              <div className="flex flex-col items-center gap-2">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Upload className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="font-medium">
                    {isDragActive ? 'Drop audio file here' : 'Drag & drop audio file'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    or click to browse (MP3, WAV, OGG, M4A, AAC)
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="url" className="space-y-4">
            <div className="space-y-2">
              <Input
                placeholder="https://example.com/audio.mp3"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                className="w-full"
              />
              <Button 
                onClick={handleUrlSubmit} 
                disabled={!urlInput.trim()}
                className="w-full"
              >
                <Link className="mr-2 h-4 w-4" />
                Use Audio URL
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

interface ImageUploadProps {
  value?: string;
  onChange: (value: string) => void;
  onFileChange?: (file: File | null) => void;
  selectedFile?: File | null;
  className?: string;
}

export function ImageUpload({ value, onChange, onFileChange, selectedFile, className }: ImageUploadProps) {
  const [urlInput, setUrlInput] = useState(value || '');

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      // Chỉ lưu file, không upload ngay
      if (onFileChange) {
        onFileChange(file);
      }
      // Tạo URL tạm thời để preview
      const fileUrl = URL.createObjectURL(file);
      onChange(fileUrl);
    }
  }, [onChange, onFileChange]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg']
    },
    maxFiles: 1
  });

  const handleUrlSubmit = () => {
    if (urlInput.trim()) {
      onChange(urlInput.trim());
    }
  };

  const handleRemove = () => {
    if (onFileChange) {
      onFileChange(null);
    }
    setUrlInput('');
    onChange('');
  };

  return (
    <Card className={cn('w-full', className)}>
      <CardContent className="p-6">
        <Label className="text-base font-medium">Image File</Label>
        
        {value && (
          <div className="mt-4 rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <ImageIcon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Image file selected</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedFile ? selectedFile.name : 'Image URL'}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRemove}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            {value && (
              <div className="mt-3">
                <img
                  src={value}
                  alt="Preview"
                  className="max-h-40 max-w-full rounded-lg object-contain"
                />
              </div>
            )}
          </div>
        )}

        <Tabs defaultValue="upload" className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload">Upload File</TabsTrigger>
            <TabsTrigger value="url">Image URL</TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="mt-4">
            <div
              {...getRootProps()}
              className={cn(
                'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
                isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
              )}
            >
              <input {...getInputProps()} />
              <div className="flex flex-col items-center gap-2">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Upload className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="font-medium">
                    {isDragActive ? 'Drop image file here' : 'Drag & drop image file'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    or click to browse (PNG, JPG, GIF, WebP, SVG)
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="url" className="space-y-4">
            <div className="space-y-2">
              <Input
                placeholder="https://example.com/image.jpg"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                className="w-full"
              />
              <Button 
                onClick={handleUrlSubmit} 
                disabled={!urlInput.trim()}
                className="w-full"
              >
                <Link className="mr-2 h-4 w-4" />
                Use Image URL
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
