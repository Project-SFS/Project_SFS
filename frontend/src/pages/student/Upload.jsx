import axios from 'axios'
import { useState, useRef, useEffect, useCallback } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { toast, Toaster } from 'react-hot-toast'
import {
    FiArrowLeft, FiCalendar, FiCheckCircle, FiClock, FiFileText, FiInfo,
    FiLink, FiTag, FiUploadCloud, FiX, FiAlertTriangle, FiAward, FiMessageSquare,
} from 'react-icons/fi'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import { URL } from '../../Utils'
import { StatusBadge, normalizeStatus, statusMeta, EVAL_CRITERIA, MarksBreakdown } from '../../submissionStatus'
import { MAX_FILES, MAX_FILE_MB, ACCEPT, kindOf, KIND_LABEL, FileLinks } from '../../submissionFiles'

const MAX_MB = MAX_FILE_MB
const TITLE_MAX = 100
const DESCRIPTION_MAX = 1000

// the three review outcomes, explained in the side panel
const OUTCOMES = [
    ['CHANGES_REQUESTED', 'The evaluator tells you what to improve. Update your solution and upload it again, even after the deadline.'],
    ['APPROVED', 'Your solution is accepted.'],
    ['REJECTED', 'Your solution is not accepted. The comment explains why.'],
]

const formatDate = (value) =>
    value ? new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'

// whole days from today until the deadline (0 = due today, negative = passed)
const daysLeft = (deadline) => {
    if (!deadline) return null
    const end = new Date(deadline)
    end.setHours(0, 0, 0, 0)
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    return Math.round((end - now) / (24 * 60 * 60 * 1000))
}

const formatSize = (bytes) => (bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`)

const isValidUrl = (value) => {
    try {
        const url = new window.URL(value)
        return url.protocol === 'http:' || url.protocol === 'https:'
    } catch {
        return false
    }
}

const Upload = () => {
    const location = useLocation()
    const probId = new URLSearchParams(location.search).get('problemId')

    // the problem this page is for, with the team's current submission (undefined = loading, null = not found)
    const [problem, setProblem] = useState(undefined)
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [link, setLink] = useState('')
    const [files, setFiles] = useState([]) // chosen files, 1-3 (PDF / PPTX)
    const [fileError, setFileError] = useState('')
    const [dragActive, setDragActive] = useState(false)
    const [touched, setTouched] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [progress, setProgress] = useState(0)
    const [confirmReplace, setConfirmReplace] = useState(false)
    const [done, setDone] = useState(null) // { replaced } after a successful upload
    const inputRef = useRef(null)

    const loadProblem = useCallback(() => {
        if (!probId) {
            setProblem(null)
            return Promise.resolve()
        }
        return axios.get(`${URL}/student/overview`, { withCredentials: true })
            .then((res) => setProblem((res.data.problems || []).find((p) => String(p.PROBLEM_ID) === String(probId)) || null))
            .catch(() => setProblem(null))
    }, [probId])

    useEffect(() => {
        loadProblem()
    }, [loadProblem])

    const submission = problem?.submission || null
    const assigned = problem?.ASSIGNMENT_STATUS === 'ASSIGNED'
    const status = submission ? normalizeStatus(submission.STATUS) : null
    // approved / rejected are final; "changes needed" reopens the submission for a revised upload
    const evaluated = status === 'APPROVED' || status === 'REJECTED'
    const changesRequested = status === 'CHANGES_REQUESTED'
    const deadlinePassed = Boolean(problem?.DEADLINE_PASSED)
    const canSubmit = Boolean(problem) && assigned && !evaluated && (!deadlinePassed || changesRequested)
    const replacing = status === 'PENDING' || changesRequested
    const remaining = daysLeft(problem?.SUB_DEADLINE)

    // updating an existing submission: start from its current details, so only the PDF has to be chosen again
    useEffect(() => {
        if (!replacing) return
        setTitle((t) => t || submission.SOL_TITLE || '')
        setDescription((d) => d || submission.SOL_DESCRIPTION || '')
        setLink((l) => l || submission.SOL_LINK || '')
    }, [submission, replacing])

    // adds chosen / dropped files (up to MAX_FILES, PDF or PPTX, each up to MAX_MB); problems are listed together
    const pickFiles = (list) => {
        const incoming = Array.from(list || [])
        if (!incoming.length) return
        const errors = []
        const next = [...files]
        for (const f of incoming) {
            if (!kindOf(f.name)) { errors.push(`"${f.name}" is not a PDF or PowerPoint (.pptx) file.`); continue }
            if (f.size > MAX_MB * 1024 * 1024) { errors.push(`"${f.name}" is ${formatSize(f.size)}. The maximum is ${MAX_MB} MB per file.`); continue }
            if (next.some((x) => x.name === f.name && x.size === f.size)) continue
            if (next.length >= MAX_FILES) { errors.push(`You can attach at most ${MAX_FILES} files.`); break }
            next.push(f)
        }
        setFiles(next)
        setFileError(errors.join(' '))
    }
    const removeFile = (index) => {
        setFiles((prev) => prev.filter((_, i) => i !== index))
        setFileError('')
    }

    const titleError = !title.trim() ? 'Please give your solution a title.' : ''
    const linkError = link.trim() && !isValidUrl(link.trim()) ? 'Enter a full link starting with https://' : ''
    const missingFile = files.length === 0 ? 'Please attach at least one file (PDF or PowerPoint).' : ''
    const formValid = !titleError && !linkError && !missingFile

    const startSubmit = (e) => {
        e.preventDefault()
        setTouched(true)
        if (!formValid || !canSubmit || uploading) return
        if (replacing) {
            setConfirmReplace(true)
            return
        }
        upload()
    }

    const upload = () => {
        setConfirmReplace(false)
        setUploading(true)
        setProgress(0)

        const form = new FormData()
        form.append('title', title.trim())
        form.append('description', description.trim())
        form.append('link', link.trim())
        form.append('problemId', probId)
        files.forEach((f) => form.append('files', f))

        axios.post(`${URL}/upload_files`, form, {
            withCredentials: true,
            onUploadProgress: (e) => e.total && setProgress(Math.round((e.loaded / e.total) * 100)),
        })
            .then((res) => {
                setDone({ replaced: Boolean(res.data?.replaced) })
                toast.success(res.data?.replaced ? 'Your solution was updated' : 'Your solution was submitted')
                setFiles([])
                setTouched(false)
                loadProblem()
            })
            .catch((err) => {
                toast.error(err.response?.data?.message || 'Upload failed, please try again')
            })
            .finally(() => {
                setUploading(false)
                setProgress(0)
            })
    }

    const inputClass = (error) =>
        `w-full px-4 py-3 rounded-xl border bg-white text-gray-800 placeholder-gray-400 transition focus:outline-none focus:ring-2 disabled:bg-gray-100 disabled:cursor-not-allowed ${
            error ? 'border-red-300 focus:ring-red-200' : 'border-gray-200 focus:ring-orange-200 focus:border-[#fc9300]'
        }`

    /* ---------- page states ---------- */

    const renderStatusBadge = () => {
        if (!problem) return null
        if (!assigned) return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">Not assigned</span>
        if (submission) return <StatusBadge status={status} />
        return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-orange-100 text-[#c76f00]">Not submitted yet</span>
    }

    const renderDeadline = () => {
        if (!problem?.SUB_DEADLINE) return null
        const tone = deadlinePassed ? 'text-red-600' : remaining <= 2 ? 'text-orange-600' : 'text-gray-600'
        const label = deadlinePassed ? (changesRequested ? 'Deadline passed · your revision is still accepted' : 'Deadline passed') : remaining <= 0 ? 'Due today' : `${remaining} day${remaining === 1 ? '' : 's'} left`
        return (
            <div className={`flex items-center gap-2 text-sm ${tone}`}>
                <FiCalendar className="shrink-0" />
                <span>Deadline: <b>{formatDate(problem.SUB_DEADLINE)}</b></span>
                {!evaluated && <span className="flex items-center gap-1"><FiClock /> {label}</span>}
            </div>
        )
    }

    return (
        <div className="min-h-screen flex flex-col bg-gray-50 text-gray-800">
            <Header />
            <Toaster position="top-right" />

            <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 pt-28 pb-16">
                <Link to="/student" className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-[#fc9300] transition mb-6">
                    <FiArrowLeft /> Back to problem statements
                </Link>

                <div className="mb-6">
                    <div className="inline-flex items-center rounded-full border border-[#fc9300]/40 bg-[#fff7ec] px-3 py-1 text-xs font-semibold uppercase tracking-[0.15em] text-[#fc9300] mb-3">
                        Submit Solution
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
                        {problem ? problem.TITLE : 'Submit your solution'}
                    </h1>
                </div>

                {problem === undefined && (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 flex justify-center">
                        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#fc9300]" />
                    </div>
                )}

                {problem === null && (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
                        <FiAlertTriangle className="mx-auto text-4xl text-[#fc9300] mb-3" />
                        <h2 className="text-lg font-semibold text-gray-900">Problem statement not found</h2>
                        <p className="text-sm text-gray-600 mt-1">Open the problem statement from your dashboard and choose "Submit Solution" there.</p>
                        <Link to="/student" className="inline-block mt-5 px-5 py-2.5 rounded-xl bg-[#fc9300] text-white font-medium hover:bg-[#e68400] transition">
                            Go to my dashboard
                        </Link>
                    </div>
                )}

                {problem && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Main column */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Problem summary */}
                            <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                                <div className="flex flex-wrap items-center gap-3 mb-3">
                                    <span className="text-sm font-bold text-[#fc9300]">SFS_{problem.PROBLEM_ID}</span>
                                    {problem.CATEGORY && (
                                        <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-gray-100 text-xs font-medium text-gray-600 capitalize">
                                            <FiTag /> {problem.CATEGORY}
                                        </span>
                                    )}
                                    {renderStatusBadge()}
                                </div>
                                {problem.DESCRIPTION && (
                                    <p className="text-sm text-gray-600 leading-relaxed line-clamp-4 whitespace-pre-line">{problem.DESCRIPTION}</p>
                                )}
                                <div className="mt-4">{renderDeadline()}</div>
                            </section>

                            {/* Success message after an upload */}
                            {done && (
                                <section className="bg-green-50 border border-green-200 rounded-2xl p-6 flex gap-4">
                                    <FiCheckCircle className="text-3xl text-green-600 shrink-0" />
                                    <div>
                                        <h2 className="font-semibold text-green-800">{done.replaced ? 'Your solution was updated' : 'Your solution was submitted'}</h2>
                                        <p className="text-sm text-green-700 mt-1">
                                            A confirmation email is on its way. The evaluator will review it and you will get the decision and their comment by email.
                                            You can still replace it until it is reviewed.
                                        </p>
                                        <div className="flex flex-wrap gap-3 mt-4">
                                            <Link to="/student" className="px-4 py-2 rounded-xl bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition">
                                                Back to dashboard
                                            </Link>
                                            <button onClick={() => setDone(null)} className="px-4 py-2 rounded-xl border border-green-300 text-green-800 text-sm font-medium hover:bg-green-100 transition">
                                                Upload a new version
                                            </button>
                                        </div>
                                    </div>
                                </section>
                            )}

                            {/* Reviewed: the evaluator's decision and comment */}
                            {(evaluated || changesRequested) && (
                                <section className={`bg-white rounded-2xl border-2 ${statusMeta(status).border} shadow-sm p-6`}>
                                    <div className="flex items-start gap-3">
                                        {evaluated ? <FiAward className={`text-2xl shrink-0 ${statusMeta(status).text}`} /> : <FiMessageSquare className="text-2xl shrink-0 text-orange-600" />}
                                        <div className="min-w-0 flex-1">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <h2 className="font-semibold text-gray-900">
                                                    {status === 'APPROVED' ? 'Your solution is approved' : status === 'REJECTED' ? 'Your solution was not approved' : 'The evaluator asked for changes'}
                                                </h2>
                                                <StatusBadge status={status} />
                                            </div>
                                            <p className="text-sm text-gray-600 mt-1">
                                                "{submission.SOL_TITLE || 'Untitled'}", submitted on {formatDate(submission.SUB_DATE)}.
                                                {evaluated ? ' It can no longer be changed.' : ' Update your solution below and submit it again.'}
                                            </p>
                                            {submission.EVALUATION_COMMENT ? (
                                                <div className="mt-4 rounded-xl bg-gray-50 border border-gray-100 px-4 py-3">
                                                    <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">Evaluator's comment</div>
                                                    <p className="text-sm text-gray-800 whitespace-pre-line">{submission.EVALUATION_COMMENT}</p>
                                                </div>
                                            ) : (
                                                <p className="mt-3 text-sm text-gray-500">No comment was added.</p>
                                            )}
                                            {normalizeStatus(submission.STATUS) === "APPROVED" && <MarksBreakdown row={submission} className="mt-4" />}
                                        </div>
                                    </div>
                                </section>
                            )}

                            {/* Why the form is locked */}
                            {!evaluated && !canSubmit && (
                                <section className="bg-red-50 border border-red-200 rounded-2xl p-5 flex gap-3 text-sm text-red-700">
                                    <FiAlertTriangle className="text-xl shrink-0 mt-0.5" />
                                    <div>
                                        {!assigned
                                            ? <>This problem statement is not assigned to your team yet. Request it from your SPOC under <b>Problem Statements</b> first.</>
                                            : <>The deadline for this problem statement has passed, so solutions can no longer be submitted or changed.</>}
                                    </div>
                                </section>
                            )}

                            {/* Upload form */}
                            {!evaluated && !done && (
                                <form onSubmit={startSubmit} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5" noValidate>
                                    {status === 'PENDING' && canSubmit && (
                                        <div className="flex gap-3 rounded-xl bg-[#fff7ec] border border-orange-200 px-4 py-3 text-sm text-gray-700">
                                            <FiInfo className="text-[#fc9300] text-lg shrink-0 mt-0.5" />
                                            <div>
                                                You already submitted <b>"{submission.SOL_TITLE || 'Untitled'}"</b> on {formatDate(submission.SUB_DATE)}.
                                                Submitting again <b>replaces</b> it, including all its files.
                                                {submission.files?.length > 0 && <FileLinks files={submission.files} className="mt-2" />}
                                            </div>
                                        </div>
                                    )}
                                    {changesRequested && canSubmit && (
                                        <h2 className="font-semibold text-gray-900">Upload your revised solution</h2>
                                    )}

                                    <fieldset disabled={!canSubmit || uploading} className="space-y-5">
                                        <div>
                                            <div className="flex justify-between mb-1.5">
                                                <label htmlFor="sol-title" className="text-sm font-semibold text-gray-700">Solution title <span className="text-red-500">*</span></label>
                                                <span className="text-xs text-gray-400">{title.length}/{TITLE_MAX}</span>
                                            </div>
                                            <input
                                                id="sol-title"
                                                value={title}
                                                maxLength={TITLE_MAX}
                                                onChange={(e) => setTitle(e.target.value)}
                                                className={inputClass(touched && titleError)}
                                                placeholder="e.g. Predictive maintenance using vibration sensors"
                                            />
                                            {touched && titleError && <p className="text-xs text-red-600 mt-1">{titleError}</p>}
                                        </div>

                                        <div>
                                            <div className="flex justify-between mb-1.5">
                                                <label htmlFor="sol-description" className="text-sm font-semibold text-gray-700">Short description</label>
                                                <span className="text-xs text-gray-400">{description.length}/{DESCRIPTION_MAX}</span>
                                            </div>
                                            <textarea
                                                id="sol-description"
                                                value={description}
                                                maxLength={DESCRIPTION_MAX}
                                                onChange={(e) => setDescription(e.target.value)}
                                                className={`${inputClass(false)} h-28 resize-y`}
                                                placeholder="Summarise your approach in a few lines (optional)"
                                            />
                                        </div>

                                        <div>
                                            <label htmlFor="sol-link" className="text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
                                                <FiLink /> Video or Drive link <span className="font-normal text-gray-400">(optional)</span>
                                            </label>
                                            <input
                                                id="sol-link"
                                                value={link}
                                                maxLength={256}
                                                onChange={(e) => setLink(e.target.value)}
                                                className={inputClass(linkError)}
                                                placeholder="https://youtube.com/... or https://drive.google.com/..."
                                            />
                                            {linkError && <p className="text-xs text-red-600 mt-1">{linkError}</p>}
                                        </div>

                                        <div>
                                            <div className="flex items-baseline justify-between mb-1.5">
                                                <span className="text-sm font-semibold text-gray-700">Solution files <span className="text-red-500">*</span></span>
                                                <span className="text-xs text-gray-400">{files.length}/{MAX_FILES} · PDF or PowerPoint, up to {MAX_MB} MB each</span>
                                            </div>
                                            {files.length > 0 && (
                                                <ul className="space-y-2 mb-3">
                                                    {files.map((f, i) => (
                                                        <li key={`${f.name}-${f.size}`} className="flex items-center gap-4 p-3 rounded-xl border border-green-200 bg-green-50">
                                                            <div className="w-10 h-10 rounded-lg bg-white border border-green-200 flex items-center justify-center shrink-0">
                                                                <FiFileText className={`text-xl ${kindOf(f.name) === 'PPTX' ? 'text-orange-600' : 'text-red-500'}`} />
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="text-sm font-medium text-gray-900 truncate" title={f.name}>{f.name}</div>
                                                                <div className="text-xs text-gray-500">{formatSize(f.size)} · {KIND_LABEL[kindOf(f.name)]}</div>
                                                            </div>
                                                            <button type="button" onClick={() => removeFile(i)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-white" aria-label={`Remove ${f.name}`}>
                                                                <FiX />
                                                            </button>
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                            {files.length < MAX_FILES && (
                                                <div
                                                    onDrop={(e) => {
                                                        e.preventDefault()
                                                        setDragActive(false)
                                                        if (canSubmit && !uploading) pickFiles(e.dataTransfer.files)
                                                    }}
                                                    onDragOver={(e) => {
                                                        e.preventDefault()
                                                        if (canSubmit) setDragActive(true)
                                                    }}
                                                    onDragLeave={() => setDragActive(false)}
                                                    onClick={() => canSubmit && !uploading && inputRef.current?.click()}
                                                    onKeyDown={(e) => {
                                                        if ((e.key === 'Enter' || e.key === ' ') && canSubmit) {
                                                            e.preventDefault()
                                                            inputRef.current?.click()
                                                        }
                                                    }}
                                                    role="button"
                                                    tabIndex={canSubmit ? 0 : -1}
                                                    className={`${files.length ? 'h-28' : 'h-48'} rounded-xl border-2 border-dashed flex flex-col items-center justify-center text-center px-6 transition ${
                                                        !canSubmit ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-60'
                                                            : dragActive ? 'border-[#fc9300] bg-orange-50 cursor-copy'
                                                            : touched && missingFile ? 'border-red-300 bg-red-50/40 cursor-pointer'
                                                            : 'border-gray-200 bg-white hover:border-[#fc9300] hover:bg-orange-50/40 cursor-pointer'
                                                    }`}
                                                >
                                                    <FiUploadCloud className="text-3xl text-[#fc9300] mb-2" />
                                                    <div className="text-sm text-gray-700">
                                                        <b>{files.length ? 'Add another file' : 'Click to choose'}</b> or drag and drop {files.length ? 'it' : 'your files'} here
                                                    </div>
                                                    <div className="text-xs text-gray-400 mt-1">Up to {MAX_FILES} files · PDF or PowerPoint (.pptx) · {MAX_MB} MB each</div>
                                                </div>
                                            )}
                                            <input
                                                ref={inputRef}
                                                type="file"
                                                multiple
                                                accept={ACCEPT}
                                                className="hidden"
                                                onChange={(e) => {
                                                    pickFiles(e.target.files)
                                                    e.target.value = null
                                                }}
                                            />
                                            {fileError && <p className="text-xs text-red-600 mt-1">{fileError}</p>}
                                            {!fileError && touched && missingFile && <p className="text-xs text-red-600 mt-1">{missingFile}</p>}
                                        </div>
                                    </fieldset>

                                    {uploading && (
                                        <div>
                                            <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                                                <div className="h-2.5 bg-[#fc9300] transition-all duration-200" style={{ width: `${progress}%` }} />
                                            </div>
                                            <div className="text-xs text-gray-500 mt-1.5">{progress < 100 ? `Uploading… ${progress}%` : 'Processing…'}</div>
                                        </div>
                                    )}

                                    <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-2 border-t border-gray-100">
                                        <Link to="/student" className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-sm font-medium text-center hover:bg-gray-50 transition">
                                            Cancel
                                        </Link>
                                        <button
                                            type="submit"
                                            disabled={!canSubmit || uploading}
                                            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-[#fc9300] text-white text-sm font-semibold shadow-sm hover:bg-[#e68400] transition disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <FiUploadCloud />
                                            {uploading ? 'Submitting…' : changesRequested ? 'Submit revised solution' : replacing ? 'Replace submission' : 'Submit solution'}
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>

                        {/* Side column: guidance */}
                        <aside className="space-y-6">
                            <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                                <h2 className="font-semibold text-gray-900 mb-3">Before you submit</h2>
                                <ul className="space-y-2.5 text-sm text-gray-600">
                                    {[
                                        `Attach up to ${MAX_FILES} files: PDF or PowerPoint (.pptx), up to ${MAX_MB} MB each.`,
                                        'You can replace your solution until it is reviewed or the deadline passes.',
                                        "You get a confirmation email now, and the evaluator's decision and comment by email after the review.",
                                    ].map((text) => (
                                        <li key={text} className="flex gap-2">
                                            <FiCheckCircle className="text-green-600 shrink-0 mt-0.5" /> <span>{text}</span>
                                        </li>
                                    ))}
                                </ul>
                            </section>

                            <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                                <h2 className="font-semibold text-gray-900 mb-1">How review works</h2>
                                <p className="text-xs text-gray-500 mb-3">An evaluator scores your solution on the five criteria below and gives one of three decisions, with a comment. You receive the decision and comment by email, and your marks when the solution is approved.</p>
                                <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Evaluation criteria (100 marks)</div>
                                <div className="space-y-1.5 mb-4">
                                    {EVAL_CRITERIA.map((c) => (
                                        <div key={c.key} className="flex justify-between gap-3 text-sm" title={c.hint}>
                                            <span className="text-gray-600">{c.label}</span>
                                            <span className="font-semibold text-gray-900 shrink-0">{c.max}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="space-y-3">
                                    {OUTCOMES.map(([key, text]) => (
                                        <div key={key} className="text-sm">
                                            <StatusBadge status={key} />
                                            <p className="text-gray-600 mt-1">{text}</p>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        </aside>
                    </div>
                )}
            </main>

            {/* Replace confirmation */}
            {confirmReplace && (
                <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
                        <h2 className="text-lg font-semibold text-gray-900">
                            {changesRequested ? 'Send your revised solution?' : 'Replace your submission?'}
                        </h2>
                        <p className="text-sm text-gray-600 mt-2">
                            {changesRequested
                                ? 'Your revised solution replaces the current one and goes back to the evaluator for review.'
                                : 'Your new solution replaces the current one. The current version cannot be restored.'}
                        </p>
                        {/* what changes: the title is whatever is typed in the form, the files are the newly chosen ones */}
                        <div className="mt-4 rounded-xl border border-gray-200 overflow-hidden text-sm">
                            <div className="grid grid-cols-[5.5rem_1fr_1fr] bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-500">
                                <span className="px-3 py-2" />
                                <span className="px-3 py-2">Current</span>
                                <span className="px-3 py-2">{changesRequested ? 'Revised' : 'New'}</span>
                            </div>
                            <div className="grid grid-cols-[5.5rem_1fr_1fr] border-t border-gray-100">
                                <span className="px-3 py-2 text-gray-500">Title</span>
                                <span className="px-3 py-2 text-gray-700 [overflow-wrap:anywhere]">{submission?.SOL_TITLE || 'Untitled'}</span>
                                <span className="px-3 py-2 font-medium text-gray-900 [overflow-wrap:anywhere]">{title.trim() || 'Untitled'}</span>
                            </div>
                            <div className="grid grid-cols-[5.5rem_1fr_1fr] border-t border-gray-100">
                                <span className="px-3 py-2 text-gray-500">Files</span>
                                <span className="px-3 py-2 text-gray-700 [overflow-wrap:anywhere]">
                                    {submission?.files?.length ? submission.files.map((f) => <div key={f.ID}>{f.NAME}</div>) : 'Your current file'}
                                </span>
                                <span className="px-3 py-2 font-medium text-gray-900 [overflow-wrap:anywhere]">
                                    {files.map((f) => <div key={`${f.name}-${f.size}`}>{f.name}</div>)}
                                </span>
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 mt-6">
                            <button onClick={() => setConfirmReplace(false)} className="px-4 py-2 rounded-xl bg-gray-100 text-gray-800 text-sm hover:bg-gray-200 transition">
                                Keep current
                            </button>
                            <button onClick={upload} className="px-4 py-2 rounded-xl bg-[#fc9300] text-white text-sm font-medium hover:bg-[#e68400] transition">
                                {changesRequested ? 'Send revised solution' : 'Replace'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <Footer />
        </div>
    )
}

export default Upload
