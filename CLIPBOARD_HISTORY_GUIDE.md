# 📋 Clipboard History Manager - User Guide

## Overview

The Clipboard History Manager is a powerful Raycast-inspired feature that automatically tracks, stores, and allows you to search through your clipboard history. Every time you copy something, it's automatically saved and can be easily accessed later.

## ✨ Features

### 🔍 **Smart Search & Access**
- **Trigger**: Type `.` to enter clipboard history mode
- **Search**: Type `.search term` to search through your clipboard history
- **Quick Access**: Browse recent clipboard items instantly

### 🎨 **Content Type Detection**
The system automatically detects and categorizes different types of content:

- **📝 Text** - Regular text content
- **🔗 URLs** - Web links (clickable previews)
- **📧 Email** - Email addresses
- **📱 Phone** - Phone numbers
- **🎨 Color** - Color codes (hex, rgb, hsl) with visual previews
- **💻 Code** - Programming code with syntax highlighting
- **📁 File** - File paths
- **🖼️ Image** - Image content (with preview placeholder)

### 🛠️ **Management Features**
- **✏️ Edit** - Modify clipboard items directly
- **🗑️ Delete** - Remove unwanted items
- **📋 Copy** - Re-copy items to clipboard
- **⏰ Timestamps** - See when items were copied
- **📊 Size Info** - View content size

### 💾 **Persistent Storage**
- All clipboard history is stored in your local database
- Survives app restarts
- Automatic duplicate detection
- Configurable history limit (1000 items by default)

## 🚀 How to Use

### Entering Clipboard Mode
1. **Quick Access**: Type `.` in the search bar
2. **Search Mode**: Type `.search term` to search immediately

### Navigating Clipboard History
- **↑↓ Arrow Keys**: Navigate through items
- **Enter**: Copy selected item to clipboard
- **Escape**: Return to normal search mode

### Item Actions
Each clipboard item has action buttons that appear on hover:
- **📋 Copy**: Copy item to clipboard
- **✏️ Edit**: Edit item content
- **🗑️ Delete**: Remove item from history

### Editing Items
1. Click the edit button (✏️) on any item
2. Modify the content in the text area
3. **Save**: `Ctrl/Cmd + Enter` or click Save button
4. **Cancel**: `Escape` or click Cancel button

## 🎨 Visual Features

### Color Previews
When you copy color codes, they're displayed with visual swatches:
- **Hex colors**: `#ff0000`, `#f00`
- **RGB colors**: `rgb(255, 0, 0)`, `rgba(255, 0, 0, 0.5)`
- **HSL colors**: `hsl(0, 100%, 50%)`, `hsla(0, 100%, 50%, 0.5)`

### Content Type Icons
Each item type has a distinct icon:
- 📝 Text content
- 🔗 URLs and links
- 📧 Email addresses
- 📱 Phone numbers
- 🎨 Colors
- 💻 Code snippets
- 📁 File paths
- 🖼️ Images

### Smart Previews
- **URLs**: Clickable links that open in your default browser
- **Code**: Syntax-highlighted preview with monospace font
- **Long text**: Automatically truncated with "..." indicator

## ⚙️ Technical Details

### Automatic Monitoring
- Clipboard is monitored every 500ms for changes
- Only saves new/changed content (no duplicates)
- Monitoring pauses when in clipboard mode to prevent interference

### Content Detection Algorithms
The system uses intelligent pattern matching to detect:
- **URLs**: Valid URL format validation
- **Colors**: Regex patterns for hex, rgb, hsl formats
- **Email**: Standard email format validation
- **Phone**: International phone number patterns
- **Code**: Common programming patterns and syntax
- **File paths**: Operating system path patterns

### Database Schema
```sql
CREATE TABLE clipboard_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL DEFAULT 'text',
  content TEXT NOT NULL,
  preview TEXT,
  size INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Performance Optimizations
- **Lazy Loading**: Only loads recent items initially
- **Search Indexing**: Fast text-based search
- **Memory Management**: Automatic cleanup of old items
- **Duplicate Prevention**: Smart duplicate detection

## 🎯 Use Cases

### For Developers
- **Code Snippets**: Save and reuse code fragments
- **API Keys**: Securely store and access tokens
- **URLs**: Keep track of important links
- **Color Codes**: Manage design colors with visual previews

### For Designers
- **Color Palettes**: Visual color management
- **Asset URLs**: Track design resources
- **Text Content**: Manage copy and content

### For General Users
- **Passwords**: Temporary password storage (use with caution)
- **Addresses**: Save frequently used addresses
- **Phone Numbers**: Quick access to contacts
- **URLs**: Bookmark management

## 🔒 Privacy & Security

### Local Storage Only
- All clipboard data is stored locally on your machine
- No data is sent to external servers
- Database file location: `AppData/Roaming/ctrl/ctrl-database.db`

### Data Management
- **Automatic Cleanup**: Old items are automatically removed
- **Manual Deletion**: Remove sensitive items immediately
- **Size Limits**: Prevents excessive storage usage

### Security Considerations
- Be cautious with sensitive data (passwords, API keys)
- Use the delete function for sensitive items
- Consider the automatic monitoring when copying sensitive content

## 🛠️ Troubleshooting

### Common Issues

**Clipboard not being monitored:**
- Check if the app has clipboard access permissions
- Restart the application
- Ensure no other clipboard managers are interfering

**Items not appearing:**
- Verify the content is actually different from the last copied item
- Check if the content is too large (size limits)
- Look for any console errors in developer tools

**Search not working:**
- Try different search terms
- Check if you're in the correct mode (type `.` first)
- Verify the database connection

### Performance Issues
- **Too many items**: Clear old clipboard history
- **Large items**: Delete oversized clipboard entries
- **Slow search**: Restart the application to refresh indexes

## 🔧 Advanced Configuration

### Customizing Limits
The clipboard manager has several configurable limits:
- **Max History Items**: 1000 items (configurable in ClipboardManager.js)
- **Monitor Interval**: 500ms (configurable in ClipboardManager.js)
- **Preview Length**: 100 characters (configurable in ClipboardManager.js)

### Database Maintenance
- **Clear All**: Use the clear function to remove all clipboard history
- **Backup**: The database file can be backed up manually
- **Reset**: Delete the database file to start fresh

## 🎨 Customization

### Styling
The clipboard interface can be customized by modifying:
- `clipboard-styles.css` - Main stylesheet
- Color schemes and themes
- Icon sets and visual elements

### Content Types
Add new content types by extending:
- `ClipboardManager.js` - Detection logic
- `ClipboardUI.js` - Display logic
- `clipboard-styles.css` - Styling

## 📊 Statistics & Insights

The clipboard manager tracks:
- **Item Count**: Total number of saved items
- **Content Types**: Distribution of different content types
- **Usage Patterns**: Most frequently accessed items
- **Storage Usage**: Total space used by clipboard data

---

## 🎉 Enjoy Your Enhanced Productivity!

The Clipboard History Manager transforms your copy-paste workflow into a powerful productivity tool. Never lose important clipboard content again, and access your entire clipboard history with just a few keystrokes!

**Quick Start**: Type `.` and start exploring your clipboard history right away!