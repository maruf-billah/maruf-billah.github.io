import React, { useState } from 'react';
import { X, Save, Download, Upload, Check, Plus, Trash2 } from 'lucide-react';

export default function CmsDrawer({ isOpen, onClose, siteData, onSaveData }) {
  if (!isOpen) return null;

  const [formData, setFormData] = useState(JSON.parse(JSON.stringify(siteData)));
  const [jsonText, setJsonText] = useState(JSON.stringify(siteData, null, 2));
  const [mode, setMode] = useState('form'); // 'form' or 'json'
  const [activeBusinessIndex, setActiveBusinessIndex] = useState(0);
  const [savedNotice, setSavedNotice] = useState(false);

  const handleSave = () => {
    try {
      let dataToSave = formData;
      if (mode === 'json') {
        dataToSave = JSON.parse(jsonText);
      }
      onSaveData(dataToSave);
      setSavedNotice(true);
      setTimeout(() => setSavedNotice(false), 3000);
    } catch (e) {
      alert('Invalid JSON structure: ' + e.message);
    }
  };

  const handleExportJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(formData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "kaizenjac_content.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportJson = (e) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], "UTF-8");
      fileReader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target.result);
          setFormData(parsed);
          setJsonText(JSON.stringify(parsed, null, 2));
          alert("Imported content successfully!");
        } catch (err) {
          alert("Error parsing uploaded JSON file.");
        }
      };
    }
  };

  const handleAddProject = (bizIdx) => {
    const copy = { ...formData };
    if (!copy.businesses[bizIdx].projects) {
      copy.businesses[bizIdx].projects = [];
    }
    const newId = `item-${Date.now()}`;
    copy.businesses[bizIdx].projects.push({
      id: newId,
      name: "New Portfolio / Project Item",
      category: "General Category",
      status: "Active",
      location: "Dhaka, Bangladesh",
      description: "Comprehensive description of this project or trade line...",
      highlights: "BNBC compliant, high-quality standards."
    });
    setFormData(copy);
  };

  const handleRemoveProject = (bizIdx, projIdx) => {
    const copy = { ...formData };
    copy.businesses[bizIdx].projects.splice(projIdx, 1);
    setFormData(copy);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-2xl bg-slate-900 border-l border-slate-800 h-full flex flex-col shadow-2xl text-white">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
              <span>Dynamic Content & Project Manager</span>
            </h2>
            <p className="text-xs text-slate-400">
              Live edit contact info, headlines, business details, and active projects.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Switcher Bar */}
        <div className="flex items-center justify-between p-4 bg-slate-950/60 border-b border-slate-800 px-6">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMode('form')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold ${
                mode === 'form' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'
              }`}
            >
              Visual Editor
            </button>
            <button
              onClick={() => {
                setJsonText(JSON.stringify(formData, null, 2));
                setMode('json');
              }}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold ${
                mode === 'json' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'
              }`}
            >
              Raw JSON Schema
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportJson}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-800 text-xs font-medium text-slate-300 hover:text-white"
              title="Download Content Schema"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export</span>
            </button>

            <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-800 text-xs font-medium text-slate-300 hover:text-white cursor-pointer">
              <Upload className="w-3.5 h-3.5" />
              <span>Import</span>
              <input type="file" accept=".json" onChange={handleImportJson} className="hidden" />
            </label>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6 custom-scrollbar">
          
          {mode === 'form' ? (
            <div className="space-y-6">
              
              {/* Primary Contact Details */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
                <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                  Contact Channels
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs text-slate-300 font-semibold">Primary Email Address</label>
                    <input
                      type="email"
                      value={formData.contacts.primaryEmail}
                      onChange={(e) => {
                        const copy = { ...formData };
                        copy.contacts.primaryEmail = e.target.value;
                        copy.meta.contactEmail = e.target.value;
                        setFormData(copy);
                      }}
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-slate-300 font-semibold">Primary Mobile Number</label>
                    <input
                      type="text"
                      value={formData.contacts.phones[0]}
                      onChange={(e) => {
                        const copy = { ...formData };
                        copy.contacts.phones[0] = e.target.value;
                        copy.meta.contactPhone = e.target.value;
                        setFormData(copy);
                      }}
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Business Project & Portfolio Manager */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
                
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider">
                    Detailed Business Projects & Program Items
                  </h3>

                  {/* Business Tab Switcher */}
                  <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
                    {formData.businesses.map((b, bIdx) => (
                      <button
                        key={b.id}
                        onClick={() => setActiveBusinessIndex(bIdx)}
                        className={`px-2.5 py-1 rounded text-[10px] font-bold ${
                          activeBusinessIndex === bIdx ? 'bg-blue-600 text-white' : 'text-slate-400'
                        }`}
                      >
                        {b.name.split(' ')[1]}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">
                      {formData.businesses[activeBusinessIndex].name} Projects / Programs
                    </span>

                    <button
                      onClick={() => handleAddProject(activeBusinessIndex)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white shadow-sm"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Item</span>
                    </button>
                  </div>

                  {formData.businesses[activeBusinessIndex].projects &&
                    formData.businesses[activeBusinessIndex].projects.map((proj, pIdx) => (
                      <div key={proj.id} className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3 relative group">
                        
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-amber-400 font-mono">
                            #0{pIdx + 1}
                          </span>
                          <button
                            onClick={() => handleRemoveProject(activeBusinessIndex, pIdx)}
                            className="p-1 rounded bg-slate-800 text-slate-400 hover:text-red-400"
                            title="Remove project item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <label className="text-[10px] text-slate-400">Project / Item Name</label>
                            <input
                              type="text"
                              value={proj.name}
                              onChange={(e) => {
                                const copy = { ...formData };
                                copy.businesses[activeBusinessIndex].projects[pIdx].name = e.target.value;
                                setFormData(copy);
                              }}
                              className="w-full px-2.5 py-1.5 rounded bg-slate-950 border border-slate-800 text-xs text-white"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] text-slate-400">Category Tag</label>
                            <input
                              type="text"
                              value={proj.category}
                              onChange={(e) => {
                                const copy = { ...formData };
                                copy.businesses[activeBusinessIndex].projects[pIdx].category = e.target.value;
                                setFormData(copy);
                              }}
                              className="w-full px-2.5 py-1.5 rounded bg-slate-950 border border-slate-800 text-xs text-white"
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] text-slate-400">Project Description</label>
                          <textarea
                            rows={2}
                            value={proj.description}
                            onChange={(e) => {
                              const copy = { ...formData };
                              copy.businesses[activeBusinessIndex].projects[pIdx].description = e.target.value;
                              setFormData(copy);
                            }}
                            className="w-full px-2.5 py-1.5 rounded bg-slate-950 border border-slate-800 text-xs text-white"
                          ></textarea>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] text-slate-400">Technical Highlights & Specs</label>
                          <input
                            type="text"
                            value={proj.highlights}
                            onChange={(e) => {
                              const copy = { ...formData };
                              copy.businesses[activeBusinessIndex].projects[pIdx].highlights = e.target.value;
                              setFormData(copy);
                            }}
                            className="w-full px-2.5 py-1.5 rounded bg-slate-950 border border-slate-800 text-xs text-slate-300"
                          />
                        </div>

                      </div>
                    ))}
                </div>

              </div>

            </div>
          ) : (
            <div className="h-full flex flex-col space-y-2">
              <label className="text-xs text-slate-400 font-mono">Dynamic JSON Editor</label>
              <textarea
                value={jsonText}
                onChange={(e) => setJsonText(e.target.value)}
                className="w-full h-96 p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-emerald-400 focus:outline-none focus:border-blue-500"
              ></textarea>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
          <div className="text-xs text-slate-400">
            {savedNotice ? (
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <Check className="w-4 h-4" /> Content & projects updated!
              </span>
            ) : (
              <span>Changes apply instantly to live website view</span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-400 hover:text-white"
            >
              Cancel
            </button>

            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 shadow-md"
            >
              <Save className="w-4 h-4" />
              <span>Apply Dynamic Content</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
