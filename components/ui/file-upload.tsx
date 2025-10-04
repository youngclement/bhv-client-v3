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
  File, 
  X, 
  Link, 
  Volume2, 
  Play, 
  Pause,
  Loader2 
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AudioUploadProps {
  value?: string;
  onChange: (value: string) => void;
  className?: string;
}

export function AudioUpload({ value, onChange, className }: AudioUploadProps) {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [urlInput, setUrlInput] = useState(value || '');
  const [isUploading, setIsUploading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioRef, setAudioRef] = useState<HTMLAudioElement | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setIsUploading(true);
      setUploadedFile(file);
      
      try {
        // Simulate file upload - replace with actual upload logic
        const formData = new FormData();
        formData.append('audio', file);
        
        // For now, we'll create a local URL for demo purposes
        // In production, you would upload to your server/cloud storage
        const fileUrl = URL.createObjectURL(file);
        onChange(fileUrl);
        
        // TODO: Replace with actual API call
        // const response = await fetch('/api/upload-audio', {
        //   method: 'POST',
        //   body: formData,
        // });
        // const data = await response.json();
        // onChange(data.url);
        
      } catch (error) {
        console.error('Upload failed:', error);
      } finally {
        setIsUploading(false);
      }
    }
  }, [onChange]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'audio/*': ['.mp3', '.wav', '.ogg', '.m4a', '.aac']
    },
    maxFiles: 1,
    disabled: isUploading
  });

  const handleUrlSubmit = () => {
    if (urlInput.trim()) {
      onChange(urlInput.trim());
    }
  };

  const handleRemove = () => {
    setUploadedFile(null);
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
    <div className={cn('space-y-4', className)}>
      <Label className="flex items-center gap-2">
        <Volume2 className="h-4 w-4" />
        Audio File
      </Label>

      {value ? (
        // Show uploaded/selected audio
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Volume2 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Audio file selected</p>
                  <p className="text-sm text-muted-foreground">
                    {uploadedFile ? uploadedFile.name : 'Audio URL'}
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
          </CardContent>
        </Card>
      ) : (
        // Show upload/URL input options
        <Tabs defaultValue="upload" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Upload File
            </TabsTrigger>
            <TabsTrigger value="url" className="flex items-center gap-2">
              <Link className="h-4 w-4" />
              Audio URL
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-4">
            <div
              {...getRootProps()}
              className={cn(
                'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
                isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25',
                isUploading && 'opacity-50 cursor-not-allowed'
              )}
            >
              <input {...getInputProps()} />
              {isUploading ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">Uploading...</p>
                </div>
              ) : (
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
              )}
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
            <p className="text-xs text-muted-foreground">
              Enter a direct URL to an audio file (MP3, WAV, OGG, M4A, AAC)
            </p>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}