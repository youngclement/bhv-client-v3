'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, Link, X, Volume2, FileAudio } from 'lucide-react';

interface AudioUploadProps {
  value: string;
  file?: File | null;
  onChange: (value: string) => void;
  onFileChange: (file: File | null) => void;
}

export function AudioUpload({ value, file, onChange, onFileChange }: AudioUploadProps) {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const audioFile = acceptedFiles[0];
      onFileChange(audioFile);
      // Clear URL when file is selected
      onChange('');
    }
  }, [onFileChange, onChange]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'audio/*': ['.mp3', '.wav', '.ogg', '.m4a', '.aac']
    },
    multiple: false
  });

  const handleRemoveFile = () => {
    onFileChange(null);
  };

  const handleUrlChange = (url: string) => {
    if (url) {
      // Clear file when URL is entered
      onFileChange(null);
    }
    onChange(url);
  };

  return (
    <div className="space-y-4">
      <Tabs defaultValue="upload" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upload">Upload File</TabsTrigger>
          <TabsTrigger value="url">Audio URL</TabsTrigger>
        </TabsList>
        
        <TabsContent value="upload" className="space-y-4">
          <div className="space-y-2">
            <Label>Upload Audio File</Label>
            {!file ? (
              <Card>
                <CardContent className="p-6">
                  <div
                    {...getRootProps()}
                    className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                      isDragActive 
                        ? 'border-primary bg-primary/10' 
                        : 'border-muted-foreground/25 hover:border-primary/50'
                    }`}
                  >
                    <input {...getInputProps()} />
                    <div className="flex flex-col items-center space-y-2">
                      <Upload className="h-8 w-8 text-muted-foreground" />
                      <div className="space-y-1">
                        <p className="text-sm font-medium">
                          {isDragActive ? 'Drop audio file here' : 'Drag & drop audio file here'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          or click to browse
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Supports: MP3, WAV, OGG, M4A, AAC
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <FileAudio className="h-8 w-8 text-primary" />
                      <div>
                        <p className="text-sm font-medium">{file.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleRemoveFile}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {/* Audio Preview */}
                  <div className="mt-3">
                    <audio 
                      controls 
                      className="w-full h-8"
                      src={URL.createObjectURL(file)}
                    >
                      Your browser does not support the audio element.
                    </audio>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="url" className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="audioUrl">Audio URL</Label>
            <div className="flex space-x-2">
              <div className="relative flex-1">
                <Link className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="audioUrl"
                  type="url"
                  placeholder="https://example.com/audio.mp3"
                  value={value}
                  onChange={(e) => handleUrlChange(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            {/* URL Audio Preview */}
            {value && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3 mb-3">
                    <Volume2 className="h-5 w-5 text-primary" />
                    <p className="text-sm font-medium">Audio Preview</p>
                  </div>
                  <audio 
                    controls 
                    className="w-full h-8"
                    src={value}
                  >
                    Your browser does not support the audio element.
                  </audio>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}