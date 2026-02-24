import { useState, useRef } from "react";
import { Upload, X, FileText, Image, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  userId: string;
  onUploadComplete: (url: string, fileName: string) => void;
  onRemove?: () => void;
  currentFile?: { url: string; name: string } | null;
  accept?: string;
  maxSizeMB?: number;
  bucketFolder?: string;
}

const ACCEPTED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

export function FileUpload({
  userId,
  onUploadComplete,
  onRemove,
  currentFile,
  accept = ".jpg,.jpeg,.png,.gif,.pdf,.doc,.docx",
  maxSizeMB = 10,
  bucketFolder = "feedback",
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFile = async (file: File) => {
    // Validate type
    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast({
        variant: "destructive",
        title: "Invalid file type",
        description: "Please upload an image (JPG, PNG, GIF) or document (PDF, DOC, DOCX)",
      });
      return;
    }

    // Validate size
    if (file.size > maxSizeMB * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "File too large",
        description: `Maximum file size is ${maxSizeMB}MB`,
      });
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${userId}/${bucketFolder}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("attachments")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("attachments")
        .getPublicUrl(filePath);

      onUploadComplete(urlData.publicUrl, file.name);
      
      toast({
        title: "File uploaded",
        description: "Your file has been uploaded successfully",
      });
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: "Failed to upload file. Please try again.",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const isImage = (url: string) => {
    return /\.(jpg|jpeg|png|gif)$/i.test(url);
  };

  if (currentFile) {
    return (
      <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border border-border">
        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          {isImage(currentFile.url) ? (
            <Image className="h-5 w-5 text-primary" />
          ) : (
            <FileText className="h-5 w-5 text-primary" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">{currentFile.name}</p>
          <a 
            href={currentFile.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-xs text-primary hover:underline"
          >
            View file
          </a>
        </div>
        {onRemove && (
          <Button variant="ghost" size="icon" onClick={onRemove} className="shrink-0">
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    );
  }

  return (
    <div
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      className={cn(
        "relative border-2 border-dashed rounded-lg p-6 transition-colors",
        dragActive 
          ? "border-primary bg-primary/5" 
          : "border-border hover:border-primary/50",
        uploading && "pointer-events-none opacity-60"
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleChange}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        disabled={uploading}
      />
      
      <div className="flex flex-col items-center justify-center text-center">
        {uploading ? (
          <>
            <Loader2 className="h-10 w-10 text-primary animate-spin mb-3" />
            <p className="text-sm font-medium text-foreground">Uploading...</p>
          </>
        ) : (
          <>
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
              <Upload className="h-6 w-6 text-primary" />
            </div>
            <p className="text-sm font-medium text-foreground mb-1">
              Drop your file here, or <span className="text-primary">browse</span>
            </p>
            <p className="text-xs text-muted-foreground">
              JPG, PNG, GIF, PDF, DOC, DOCX (max {maxSizeMB}MB)
            </p>
          </>
        )}
      </div>
    </div>
  );
}