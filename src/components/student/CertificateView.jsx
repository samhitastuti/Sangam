import React, { useEffect, useRef, useState } from 'react';
import { Printer, ArrowLeft, ShieldCheck, Download, Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import confetti from 'canvas-confetti';

export default function CertificateView({
  studentName,
  opportunityTitle,
  orgName,
  completionDate,
  applicationId,
  collegeName
}) {
  const [downloading, setDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const certRef = useRef(null);

  useEffect(() => {
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#0C3B2E', '#FF5A1F', '#F5A623']
      });
    } catch (e) {
      // Ignore
    }
  }, []);

  const formattedDate = completionDate
    ? new Date(completionDate).toLocaleDateString('en-IN', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      })
    : new Date().toLocaleDateString('en-IN', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      });

  const certNumber = (applicationId || 'SGM-CERT')
    .replace(/[^a-zA-Z0-9]/g, '')
    .toUpperCase()
    .slice(0, 12);

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      // Generate clean high-resolution canvas certificate image
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const width = 1600;
      const height = 1130;
      canvas.width = width;
      canvas.height = height;

      // Background paper tone
      ctx.fillStyle = '#FBF9F5';
      ctx.fillRect(0, 0, width, height);

      // Outer Border
      ctx.lineWidth = 14;
      ctx.strokeStyle = '#0C3B2E';
      ctx.strokeRect(30, 30, width - 60, height - 60);

      // Inner Accent Border
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#FF5A1F';
      ctx.strokeRect(46, 46, width - 92, height - 92);

      // Delicate Hairline Inset
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(12, 59, 46, 0.2)';
      ctx.strokeRect(60, 60, width - 120, height - 120);

      // Top Brand Kicker
      ctx.fillStyle = '#0C3B2E';
      ctx.font = 'bold 20px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('SANGAM — COLLEGIATE VOLUNTEER & IMPACT NETWORK', width / 2, 130);

      // Certificate Title
      ctx.font = '900 46px sans-serif';
      ctx.fillText('CERTIFICATE OF COMMUNITY SERVICE', width / 2, 205);

      // Decorative divider
      ctx.fillStyle = '#FF5A1F';
      ctx.fillRect(width / 2 - 80, 235, 160, 4);

      // Conferred text
      ctx.fillStyle = '#57655F';
      ctx.font = 'italic 22px serif';
      ctx.fillText('This official credential is proudly conferred upon', width / 2, 310);

      // Recipient Name
      ctx.fillStyle = '#141C18';
      ctx.font = '900 52px sans-serif';
      ctx.fillText(studentName || 'Student Volunteer', width / 2, 385);

      // College
      if (collegeName) {
        ctx.fillStyle = '#0C3B2E';
        ctx.font = 'bold 26px sans-serif';
        ctx.fillText(collegeName, width / 2, 435);
      }

      // Achievement narrative
      ctx.fillStyle = '#57655F';
      ctx.font = '22px sans-serif';
      ctx.fillText(
        'for distinguished civic engagement and automated collegiate squad contribution in the initiative:',
        width / 2,
        505
      );

      // Programme Box
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(width / 2 - 450, 545, 900, 150);
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = '#D5CEC2';
      ctx.strokeRect(width / 2 - 450, 545, 900, 150);

      ctx.fillStyle = '#0C3B2E';
      ctx.font = 'bold 34px sans-serif';
      ctx.fillText(opportunityTitle || 'Community Outreach Programme', width / 2, 615);

      ctx.fillStyle = '#FF5A1F';
      ctx.font = 'bold 20px sans-serif';
      ctx.fillText(`Conducted by ${orgName || 'Host Organisation'}`, width / 2, 660);

      // Signature & Validation Block
      const lineY = 880;

      // Left: Host
      ctx.fillStyle = '#141C18';
      ctx.font = 'bold 24px sans-serif';
      ctx.fillText(orgName || 'Authorising Host', 340, lineY);
      ctx.strokeStyle = '#57655F';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(220, lineY + 12);
      ctx.lineTo(460, lineY + 12);
      ctx.stroke();
      ctx.fillStyle = '#57655F';
      ctx.font = '16px sans-serif';
      ctx.fillText('Authorising Signature', 340, lineY + 36);

      // Center: Security Seal
      ctx.fillStyle = '#0C3B2E';
      ctx.beginPath();
      ctx.arc(width / 2, lineY - 10, 42, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 26px sans-serif';
      ctx.fillText('★ SGM ★', width / 2, lineY - 2);

      ctx.fillStyle = '#57655F';
      ctx.font = '15px monospace';
      ctx.fillText(`ID: ${certNumber}`, width / 2, lineY + 54);

      // Right: Date
      ctx.fillStyle = '#141C18';
      ctx.font = 'bold 22px sans-serif';
      ctx.fillText(formattedDate, width - 340, lineY);
      ctx.strokeStyle = '#57655F';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(width - 460, lineY + 12);
      ctx.lineTo(width - 220, lineY + 12);
      ctx.stroke();
      ctx.fillStyle = '#57655F';
      ctx.font = '16px sans-serif';
      ctx.fillText('Date Issued', width - 340, lineY + 36);

      // Bottom footer
      ctx.fillStyle = '#94A3B8';
      ctx.font = '13px monospace';
      ctx.fillText(
        `Sangam Verified Credential · Tamper-evident ledger reference #${certNumber} · Verify at sangam.network`,
        width / 2,
        height - 80
      );

      // Export file download trigger
      const dataUrl = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.href = dataUrl;
      const cleanFileName = `Sangam_Certificate_${studentName.replace(/\s+/g, '_')}_${certNumber}.png`;
      downloadLink.download = cleanFileName;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);

      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to download certificate image:', err);
      // Fallback to browser print dialog
      window.print();
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-16">
      
      {/* Top action bar */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#57655F] hover:text-[#0C3B2E] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to my applications</span>
        </Link>

        <div className="flex items-center gap-3">
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded bg-transparent border border-[#0C3B2E]/20 hover:border-[#0C3B2E] text-[#141C18] text-xs font-semibold transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4 text-[#0C3B2E]" />
            <span>Print dialog</span>
          </button>

          <button
            onClick={handleDownload}
            disabled={downloading}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded bg-[#0C3B2E] hover:bg-[#07251D] text-white text-xs font-semibold transition-all cursor-pointer shadow-sm active:scale-95 disabled:opacity-50"
          >
            {downloadSuccess ? (
              <>
                <Check className="w-4 h-4 text-[#F5A623]" />
                <span>Downloaded image!</span>
              </>
            ) : downloading ? (
              <span>Generating certificate...</span>
            ) : (
              <>
                <Download className="w-4 h-4 text-[#F5A623]" />
                <span>Download certificate (.png)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Official Certificate Container (Editorial Museum & Institutional Style) */}
      <div
        ref={certRef}
        className="bg-white rounded-lg p-6 sm:p-12 border-2 border-[#0C3B2E] text-center shadow-sm relative overflow-hidden"
      >
        {/* Subtle watermark seal */}
        <div className="absolute right-4 bottom-4 text-[120px] font-black text-[#0C3B2E]/[0.03] select-none pointer-events-none font-display">
          SGM
        </div>

        {/* Inner frame */}
        <div className="border border-[#D5CEC2] p-6 sm:p-10 bg-[#FBF9F5]/40 relative z-10">
          
          {/* Header */}
          <div className="mb-8">
            <div className="text-[11px] uppercase tracking-[0.25em] font-bold text-[#0C3B2E] mb-1.5 font-display">
              Sangam Collegiate Volunteer & Impact Network
            </div>
            <h1 className="font-display text-2xl sm:text-4xl font-black tracking-tight text-[#141C18] uppercase">
              Certificate of Community Service
            </h1>
            <div className="w-20 h-1 bg-[#FF5A1F] mx-auto mt-4" />
          </div>

          {/* Recipient */}
          <p className="text-xs text-[#57655F] uppercase tracking-wider mb-2 font-medium">
            This is proudly conferred upon
          </p>

          <h2 className="font-display text-3xl sm:text-4xl font-black text-[#141C18] mb-1 tracking-tight">
            {studentName}
          </h2>

          {collegeName && (
            <p className="text-sm font-bold text-[#0C3B2E] mb-6 tracking-wide">
              {collegeName}
            </p>
          )}

          <p className="font-serif-quote italic text-base sm:text-lg text-[#57655F] max-w-xl mx-auto leading-relaxed mb-6">
            for dedicated civic engagement, collegiate collaboration, and teamwork in the verified initiative:
          </p>

          {/* Opportunity Box */}
          <div className="bg-white border border-[#0C3B2E]/15 rounded p-5 max-w-lg mx-auto mb-10 shadow-xs">
            <h3 className="font-display text-lg sm:text-xl font-bold text-[#0C3B2E]">
              {opportunityTitle}
            </h3>
            <p className="text-xs font-semibold text-[#FF5A1F] mt-1">
              Conducted by {orgName}
            </p>
          </div>

          {/* Verification Footer */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-end pt-8 border-t border-[#0C3B2E]/10 text-center">
            <div>
              <div className="text-xs font-bold text-[#141C18] border-b border-[#57655F]/30 pb-1 max-w-[150px] mx-auto">
                {orgName}
              </div>
              <span className="text-[11px] text-[#57655F] mt-1 block uppercase tracking-wider font-semibold">
                Authorising host
              </span>
            </div>

            <div className="flex flex-col items-center">
              <ShieldCheck className="w-7 h-7 text-[#0C3B2E] mb-1" />
              <span className="text-[11px] text-[#57655F] font-mono">
                Verified ID: {certNumber}
              </span>
            </div>

            <div>
              <div className="text-xs font-bold text-[#141C18] border-b border-[#57655F]/30 pb-1 max-w-[150px] mx-auto">
                {formattedDate}
              </div>
              <span className="text-[11px] text-[#57655F] mt-1 block uppercase tracking-wider font-semibold">
                Date completed
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
