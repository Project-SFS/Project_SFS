import axios from 'axios'
import { useState, useRef, useEffect } from 'react'
import { auth, URL } from '../../Utils'
import { useLocation, useParams } from 'react-router-dom'
import {toast, Toaster} from "react-hot-toast"
const Upload = () => {
    const [files, setFiles] = useState([])
    const [previews, setPreviews] = useState([])
    const [progress, setProgress] = useState(0)
    const [status, setStatus] = useState(null)
    const [dragActive, setDragActive] = useState(false)
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [link, setLink] = useState('')
    const inputRef = useRef(null)
    const [email, setEmail] = useState();
    
    const { problemId } = useParams();


    const location = useLocation();

    
    const probId = location.search.split('=')[1];


    // useEffect(() => {
    //     // build previews and clean up old object URLs
    //     const urls = files.map((f) => URL.createObjectURL(f))
    //     setPreviews(urls)
    //     return () => {
    //         urls.forEach((u) => URL.revokeObjectURL(u))
    //     }
    // }, [files])

    const handleFileChange = (e) => {
     
        
        const selected = Array.from(e.target.files)
        if (selected.length) {
            setFiles((prev) => [...prev, ...selected])
            setProgress(0)
            setStatus(null)
        }
        e.target.value = null
    }
     ;
    
    useEffect(() => {
        axios.defaults.withCredentials = true;
        const res = axios.get(`${URL}/cookie`, { withCredentials: true })
        res.then(res => {
            setEmail(res.data.EMAIL);

        }
        )
   },[])
    
    

  
    

    const onDrop = (e) => {
        e.preventDefault()
        setDragActive(false)
        const dropped = Array.from(e.dataTransfer.files)
        if (dropped.length) {
            setFiles((prev) => [...prev, ...dropped])
            setProgress(0)
            setStatus(null)
        }
    }

    const removeFile = (index) => {
        setFiles((prev) => prev.filter((_, i) => i !== index))
    }

    const uploadFiles = () => {

        if (!title.trim()) {
            setStatus({ type: 'error', msg: 'Please provide a solution title' })
            return
        }

        if (files.length === 0) {
            setStatus({ type: 'error', msg: 'No files selected' })
            return
        }

        const loading = toast.loading("Processing");


        const form = new FormData()
        form.append('title', title)
        form.append('description', description)
        form.append('link', link)
        // form.append('files',)
        form.append('email', email);
        form.append('problemId', probId)
        files.forEach((f) => form.append('files', f))
  
        axios.post(`${URL}/upload_files`, form, {
            headers: {
                "Content-Type":"multipart/form-data"
            }
        })
            .then(res => {
                if (res.data) {
                    toast.dismiss(loading);
                    toast.success("Uploaded");
                    clearAll()
                }
                else {
                    toast.error("Error uploading")
                }
        }
        )
    }

    const clearAll = () => {
        setFiles([])
        setProgress(0)
        setStatus(null)
        setTitle('')
        setDescription('')
        setLink('')
        if (inputRef.current) inputRef.current.value = null
    }

    return (
        // added pt-24 to push content below a fixed header; adjust value if your header height differs
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6 pt-24 mb-6">
            <Toaster/>
            <div className="w-full max-w-5xl bg-white/60 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="flex flex-col md:flex-row">
                    {/* Left: Dropzone + inputs */}
                    <div className="md:w-1/2 p-8 flex flex-col items-center justify-center">
                        <div className="w-full space-y-3">
                            <label className="text-sm font-medium text-gray-700">Solution Title</label>
                            <input
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-300"
                                placeholder="Enter solution title"
                                aria-label="Solution title"
                            />

                            <label className="text-sm font-medium text-gray-700">Description</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full px-3 py-2 border rounded-md h-24 resize-y focus:outline-none focus:ring-2 focus:ring-orange-300"
                                placeholder="Add a short description"
                                aria-label="Solution description"
                            />

                            <label className="text-sm font-medium text-gray-700">YouTube or Drive Link (optional)</label>
                            <input
                                value={link}
                                onChange={(e) => setLink(e.target.value)}
                                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-300"
                                placeholder="https://youtube.com/... or https://drive.google.com/..."
                                aria-label="YouTube or Drive link"
                            />
                        </div>

                        <div
                            onDrop={onDrop}
                            onDragOver={(e) => {
                                e.preventDefault()
                                setDragActive(true)
                            }}
                            onDragLeave={() => setDragActive(false)}
                            onClick={() => inputRef.current && inputRef.current.click()}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault()
                                    inputRef.current && inputRef.current.click()
                                }
                            }}
                            role="button"
                            tabIndex={0}
                            className={`w-full mt-4 h-56 rounded-xl border-2 transition-all duration-150 flex flex-col items-center justify-center text-center px-6 ${
                                dragActive ? 'border-orange-400 bg-orange-50/60 shadow-inner' : 'border-dashed border-gray-200 bg-white'
                            }`}
                        >
                            <svg
                                className="w-12 h-12 text-orange-500 mb-3"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                xmlns="http://www.w3.org/2000/svg"
                                aria-hidden
                            >
                                <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M7 16v4a1 1 0 001 1h8a1 1 0 001-1v-4M12 3v13" />
                                <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M8 8l4-4 4 4" />
                            </svg>

                            <div className="text-sm text-gray-600 mb-2">Drag & drop files here or click to browse</div>
                        </div>

                        <div className="text-xs text-gray-400 mt-2">Supports multiple files • Max single file size as configured on backend</div>

                        <input ref={inputRef} type="file" multiple onChange={handleFileChange} className="hidden" aria-label="Upload files" />

                        <div className="mt-6 flex gap-3">
                            <button
                                type="button"
                                onClick={uploadFiles}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-full shadow hover:bg-orange-600 transition"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                                    <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5-5 5 5" />
                                </svg>
                                Upload
                            </button>

                            <button
                                type="button"
                                onClick={clearAll}
                                className="px-4 py-2 border rounded-full bg-white hover:bg-gray-50 transition text-sm"
                            >
                                Clear
                            </button>
                        </div>

                        {status && (
                            <div
                                className={`mt-4 text-sm ${
                                    status.type === 'error' ? 'text-red-600' : status.type === 'success' ? 'text-green-600' : 'text-gray-600'
                                }`}
                                role="status"
                            >
                                {status.msg}
                            </div>
                        )}
                    </div>

                    {/* Right: Files preview */}
                    <div className="md:w-1/2 p-6 border-l hidden md:block">
                        <h2 className="text-lg font-semibold text-gray-800 mb-4">Selected Files</h2>

                        {files.length === 0 ? (
                            <div className="text-sm text-gray-400">No files selected</div>
                        ) : (
                            <div className="space-y-3 max-h-[420px] overflow-auto pr-2">
                                {files.map((f, i) => (
                                    <div
                                        key={i}
                                        className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:shadow-sm transition bg-white"
                                    >
                                        <div className="w-16 h-12 shrink-0 rounded-md overflow-hidden bg-gray-50 flex items-center justify-center">
                                            {f.type && f.type.startsWith('image/') ? (
                                                <img src={previews[i]} alt={f.name} className="object-cover w-full h-full" />
                                            ) : (
                                                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                                                    <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M7 7v10" />
                                                    <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M17 7v10" />
                                                </svg>
                                            )}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between">
                                                <div className="text-sm font-medium text-gray-800 truncate">{f.name}</div>
                                                <div className="text-xs text-gray-400">{(f.size / 1024).toFixed(1)} KB</div>
                                            </div>
                                            <div className="text-xs text-gray-500 mt-1 truncate">{f.type || 'Unknown type'}</div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => removeFile(i)}
                                                className="text-red-500 hover:text-red-600 text-sm"
                                                aria-label={`Remove ${f.name}`}
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {progress > 0 && (
                            <div className="mt-4">
                                <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                                    <div
                                        className="h-3 bg-linear-to-r from-orange-400 to-orange-600 transition-width"
                                        style={{ width: `${progress}%` }}
                                    />
                                </div>
                                <div className="text-xs text-gray-500 mt-2">{progress}% uploaded</div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Mobile file list */}
                <div className="md:hidden border-t p-4">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Files</h3>
                    {files.length === 0 ? (
                        <div className="text-sm text-gray-400">No files selected</div>
                    ) : (
                        <div className="flex gap-2 overflow-x-auto">
                            {files.map((f, i) => (
                                <div key={i} className="min-w-[140px] p-2 bg-white border rounded-lg">
                                    <div className="text-sm font-medium truncate">{f.name}</div>
                                    <div className="text-xs text-gray-400">{(f.size / 1024).toFixed(1)} KB</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default Upload
