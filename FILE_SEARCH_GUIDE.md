# 📁 Local File & Folder Search - User Guide

## Overview

The Local File & Folder Search feature allows you to search through your computer's files and folders directly from the main search bar. No more navigating through complex folder structures - just type and find what you need instantly!

## ✨ Features

### 🔍 **Smart Search & Access**
- **Trigger**: Type `>` to enter file search mode
- **Search**: Type `>filename` to search immediately
- **Cross-Platform**: Works on Windows, macOS, and Linux
- **No Hardcoded Paths**: Automatically detects user directories

### 📂 **Intelligent Directory Indexing**
The system automatically searches through common user directories:
- **Desktop** - Quick access to desktop files
- **Documents** - All your documents and files
- **Downloads** - Recently downloaded files
- **Pictures** - Image files and photos
- **Videos/Movies** - Video content
- **Music** - Audio files and music

### 🎯 **File Type Detection**
Automatically categorizes and displays files with appropriate icons:

- **📁 Folders** - Directory navigation
- **📝 Documents** - Text files, RTF, ODT
- **📄 PDF** - PDF documents
- **📘 Word** - DOC, DOCX files
- **💻 Code** - JS, Python, Java, C++, etc.
- **🌐 Markup** - HTML, XML files
- **🎨 Stylesheets** - CSS, SCSS, SASS
- **⚙️ Config** - JSON, YAML, INI files
- **🖼️ Images** - JPG, PNG, GIF, SVG, etc.
- **🎬 Video** - MP4, AVI, MKV, MOV
- **🎵 Audio** - MP3, WAV, FLAC
- **📦 Archives** - ZIP, RAR, 7Z, TAR
- **⚡ Executables** - EXE, MSI, APP, DEB

### 🛠️ **File Operations**
Each file/folder has quick action buttons:
- **📂 Open** - Open file with default application
- **👁️ Reveal** - Show in file explorer/finder
- **📋 Copy Path** - Copy full file path to clipboard

### 📊 **Rich Metadata Display**
- **File Size** - Human-readable format (KB, MB, GB)
- **Last Modified** - Smart timestamps (Today, Yesterday, 2 days ago)
- **File Path** - Truncated path display with full path on hover
- **File Type Badge** - Visual type indicator

## 🚀 How to Use

### Entering File Search Mode
1. **Quick Access**: Type `>` in the search bar
2. **Direct Search**: Type `>filename` to search immediately

### Searching for Files
- **Simple Search**: `>document` - finds files containing "document"
- **Multiple Terms**: `>project report` - finds files with both terms
- **File Extensions**: `>.pdf` - finds PDF files
- **Folder Search**: `>photos` - finds folders named "photos"

### Navigating Results
- **↑↓ Arrow Keys**: Navigate through results
- **Enter**: Open selected file/folder
- **Escape**: Return to normal search mode

### File Actions
Each file has three action buttons (appear on hover):
1. **Open Button** (📂/🔗): Opens the file with default application
2. **Reveal Button** (👁️): Shows the file in your file explorer
3. **Copy Path Button** (📋): Copies the full file path to clipboard

## 🎨 Visual Features

### Smart File Icons
- Each file type has a distinct, colored icon
- Folders are highlighted in blue
- File type badges show the category
- Visual feedback for all actions

### Path Display
- **Smart Truncation**: Long paths are shortened with "..."
- **Hover for Full Path**: See complete path on mouseover
- **Monospace Font**: Easy-to-read file paths

### Action Feedback
- **Visual Animations**: Smooth feedback for all actions
- **Color Coding**: Different colors for different actions
  - 🟢 Green: File opened successfully
  - 🟡 Yellow: File revealed in explorer
  - 🟣 Purple: Path copied to clipboard
  - 🔴 Red: Action failed

## ⚙️ Technical Details

### Background Indexing
- **Smart Indexing**: Builds file index in the background
- **Priority Directories**: Desktop, Documents, Downloads indexed first
- **Depth Limiting**: Searches 2 levels deep for performance
- **Automatic Updates**: Index refreshes periodically

### Search Algorithm
1. **Index Search**: Fast search through pre-built index
2. **Live Search**: Real-time file system search for comprehensive results
3. **Relevance Scoring**: Results sorted by relevance and recency
4. **Performance Optimized**: Limited to 50 results for speed

### Cross-Platform Support
- **Windows**: Uses Windows-specific paths and APIs
- **macOS**: Supports Mac file system and conventions
- **Linux**: Compatible with Linux directory structures
- **No Hardcoding**: Dynamically detects user directories

### File System Integration
```javascript
// Supported directories (auto-detected):
- ~/Desktop
- ~/Documents  
- ~/Downloads
- ~/Pictures
- ~/Videos (~/Movies on macOS)
- ~/Music
```

## 🔧 Performance Optimizations

### Efficient Search
- **Indexed Search**: Pre-built index for instant results
- **Lazy Loading**: Only loads what's needed
- **Result Limiting**: Maximum 50 results to prevent slowdown
- **Smart Caching**: Frequently accessed files cached

### Memory Management
- **Background Processing**: Indexing doesn't block UI
- **Depth Limiting**: Prevents infinite recursion
- **Error Handling**: Graceful handling of permission errors

## 📱 Use Cases

### For Developers
- **Quick File Access**: Find source code files instantly
- **Project Navigation**: Locate project files and configs
- **Log File Search**: Find application logs quickly
- **Asset Management**: Locate images, icons, resources

### For Content Creators
- **Media Files**: Find photos, videos, audio files
- **Project Files**: Locate design files, documents
- **Asset Organization**: Quick access to creative assets
- **Backup Navigation**: Find archived files

### For General Users
- **Document Search**: Find reports, letters, PDFs
- **Download Management**: Locate downloaded files
- **Photo Search**: Find specific images or albums
- **Quick Navigation**: Bypass complex folder structures

## 🔒 Privacy & Security

### Local Only
- **No External Servers**: All searches happen locally
- **No Data Collection**: No file information sent anywhere
- **Permission Respect**: Respects file system permissions
- **Secure Access**: Only accesses user-accessible directories

### Performance Considerations
- **Background Processing**: Won't slow down your system
- **Selective Indexing**: Only indexes common directories
- **Error Handling**: Gracefully handles restricted directories

## 🛠️ Troubleshooting

### Common Issues

**No files found:**
- Check if you're in file search mode (type `>` first)
- Verify the file exists in indexed directories
- Try different search terms
- Wait for background indexing to complete

**Slow search results:**
- Background indexing may still be running
- Try more specific search terms
- Restart the application to refresh index

**Files won't open:**
- Check file permissions
- Verify default application is set
- Try "Reveal in Explorer" instead

**Permission errors:**
- Some system directories are protected
- Try searching in user directories instead
- Check if antivirus is blocking access

### Performance Tips
- **Use Specific Terms**: More specific searches are faster
- **Wait for Indexing**: Let background indexing complete
- **Regular Restarts**: Restart app occasionally to refresh index

## 🎯 Advanced Tips

### Search Strategies
- **File Extensions**: Use `.ext` to find specific file types
- **Partial Names**: Search with partial filenames
- **Multiple Terms**: Use space-separated terms for better results
- **Case Insensitive**: All searches are case-insensitive

### Keyboard Shortcuts
- **`>`** - Enter file search mode
- **`↑↓`** - Navigate results
- **`Enter`** - Open selected file
- **`Esc`** - Exit file search mode

### File Management
- **Quick Open**: Double-click or Enter to open
- **Explorer Integration**: Use "Reveal" to see file location
- **Path Copying**: Copy paths for scripts and automation

## 🔧 Customization

### Extending Search Paths
The system can be extended to search additional directories by modifying the `getUserDirectories` function in the main process.

### Adding File Types
New file types can be added by extending the `supportedExtensions` set and `getFileType` method in `FileSearchManager.js`.

### Custom Actions
Additional file actions can be added by extending the `FileSearchUI.js` component.

---

## 🎉 Start Exploring Your Files!

The Local File & Folder Search transforms how you navigate your computer. No more clicking through endless folders - just type `>` and find what you need instantly!

**Quick Start**: Type `>` and start searching your files right away!

### Example Searches:
- `>readme` - Find README files
- `>photo vacation` - Find vacation photos  
- `>.pdf report` - Find PDF reports
- `>config` - Find configuration files
- `>download` - Find recent downloads