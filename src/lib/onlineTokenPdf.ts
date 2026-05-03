import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export async function generateOnlineTokenPDF(tokenData: any, clinicData: any) {
  return new Promise<void>((resolve, reject) => {
    const token = tokenData.token_number || "";
    const patient = tokenData.patient_name || "Walk-in";
    
    // Format date exactly like the updated logic:
    const d = new Date(tokenData.created_at || new Date());
    const dateStr = `${d.getDate().toString().padStart(2, "0")}-${(d.getMonth() + 1).toString().padStart(2, "0")}-${d.getFullYear()}`;
    
    let h = d.getHours();
    const m = d.getMinutes().toString().padStart(2, '0');
    const ampm = h >= 12 ? 'pm' : 'am';
    h = h % 12;
    h = h ? h : 12;
    const timePart = `${h}:${m} ${ampm}`;
    const dateTime = `${dateStr}  ${timePart}`;

    const clinicName = clinicData.clinic_name || 'CLINIC';
    const clinicUrl = clinicData.qr_base_url || '';
    const doctorName = tokenData.doctors?.name ? `Dr. ${tokenData.doctors.name}` : '—';
    const specialization = tokenData.doctors?.specialization || '—';
    const status = tokenData.status || 'waiting';
    const phone = clinicData.contact_phone || 'Not provided';
    const address = clinicData.address || 'Not provided';
    const hours = clinicData.working_hours || '';

    // Create off-screen container
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '-9999px';
    
    // We use the exact HTML styling from TokenReceipt.tsx
    // The heartbeat icon is replaced with an inline SVG to guarantee it renders perfectly in html2canvas without waiting for webfonts
    container.innerHTML = `
      <div style="width: 302px; background: #fff; color: #000; font-family: 'Courier New', Courier, monospace; font-size: 11px; position: relative;">
        <!-- Watermark -->
        <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg); font-size: 40px; color: rgba(29, 78, 216, 0.15); font-weight: bold; z-index: 0; pointer-events: none; white-space: nowrap;">
          ONLINE TOKEN
        </div>
        
        <div style="position: relative; z-index: 1;">
          <div style="display: flex; align-items: center; gap: 8px; padding: 8px 10px 7px 10px; border-bottom: 2px solid #000; width: 100%; box-sizing: border-box;">
            <div style="width: 52px; height: 52px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
              <svg viewBox="0 0 512 512" style="width: 42px; height: 42px; fill: #000;">
                <path d="M320.2 243.8l-49.7 99.4c-6 12.1-23.4 11.7-28.9-.6l-56.9-126.3-30 71.7H60.6l50.2 50.2c46.9 46.9 122.7 46.9 169.6 0l50.2-50.2h-10.4zM448 86.6c-46.9-46.9-122.7-46.9-169.6 0L256 109l-22.4-22.4c-46.9-46.9-122.7-46.9-169.6 0-38.3 38.3-45.4 96.6-21.4 141.5H94.9l43-102.6c5.7-13.6 25-13.8 30.9-.4l56.8 126.1 49.8-99.6c5.9-11.8 22.8-12 28.9-.3l37 76.8h110.1c24-44.9 16.9-103.2-21.4-141.5z"/>
              </svg>
            </div>
            <div style="flex: 1; min-width: 0; overflow: hidden;">
              <div style="font-size: 12px; font-weight: bold; color: #000; line-height: 1.2; word-break: break-word;">${clinicName.toUpperCase()}</div>
              <div style="font-size: 8px; color: #555; margin-top: 1px;">Healthcare Token System</div>
            </div>
          </div>

          ${clinicUrl ? `<div style="text-align: center; font-size: 9px; color: #555; padding: 4px 10px; word-break: break-all; width: 100%; box-sizing: border-box;">${clinicUrl}</div>` : ''}

          <div style="border-top: 1px dashed #000; width: calc(100% - 20px); margin: 3px 10px; box-sizing: border-box;"></div>
          <div style="text-align: center; font-size: 11px; font-weight: bold; letter-spacing: 2px; padding: 4px 0; width: 100%; box-sizing: border-box;">TOKEN RECEIPT</div>
          <div style="border-top: 1px dashed #000; width: calc(100% - 20px); margin: 3px 10px; box-sizing: border-box;"></div>

          <div style="font-size: 44px; font-weight: bold; text-align: center; line-height: 1.1; padding: 3px 0; width: 100%; box-sizing: border-box;">#${token}</div>

          <div style="border-top: 1px dashed #000; width: calc(100% - 20px); margin: 3px 10px; box-sizing: border-box;"></div>

          <div style="display: flex; justify-content: space-between; align-items: flex-start; width: 100%; padding: 2px 10px; font-size: 11px; box-sizing: border-box;">
            <span style="color: #444; white-space: nowrap; flex-shrink: 0; margin-right: 6px; min-width: 55px;">Patient</span>
            <span style="font-weight: bold; text-align: right; word-break: break-word; flex: 1;">${patient}</span>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: flex-start; width: 100%; padding: 2px 10px; font-size: 11px; box-sizing: border-box;">
            <span style="color: #444; white-space: nowrap; flex-shrink: 0; margin-right: 6px; min-width: 55px;">Doctor</span>
            <span style="font-weight: bold; text-align: right; word-break: break-word; flex: 1;">${doctorName}</span>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: flex-start; width: 100%; padding: 2px 10px; font-size: 11px; box-sizing: border-box;">
            <span style="color: #444; white-space: nowrap; flex-shrink: 0; margin-right: 6px; min-width: 55px;">Specialization</span>
            <span style="font-weight: bold; text-align: right; word-break: break-word; flex: 1;">${specialization}</span>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: flex-start; width: 100%; padding: 2px 10px; font-size: 11px; box-sizing: border-box;">
            <span style="color: #444; white-space: nowrap; flex-shrink: 0; margin-right: 6px; min-width: 55px;">Date</span>
            <span style="font-weight: bold; text-align: right; word-break: break-word; flex: 1;">${dateTime}</span>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: flex-start; width: 100%; padding: 2px 10px; font-size: 11px; box-sizing: border-box;">
            <span style="color: #444; white-space: nowrap; flex-shrink: 0; margin-right: 6px; min-width: 55px;">Status</span>
            <span style="font-weight: bold; text-align: right; word-break: break-word; flex: 1; text-transform: capitalize;">${status}</span>
          </div>

          <div style="border-top: 1px dashed #000; width: calc(100% - 20px); margin: 3px 10px; box-sizing: border-box;"></div>

          <div style="text-align: center; font-size: 10px; padding: 4px 10px; line-height: 1.4; width: 100%; word-break: break-word; box-sizing: border-box;">
            Please wait for your token number to be called.
            ${clinicUrl ? `<div style="margin-top:4px;">Live status: <strong>${clinicUrl}</strong></div>` : ''}
          </div>

          <div style="border-top: 1px dashed #000; width: calc(100% - 20px); margin: 3px 10px; box-sizing: border-box;"></div>

          <div style="display: flex; justify-content: space-between; align-items: flex-start; width: 100%; padding: 2px 10px; font-size: 11px; box-sizing: border-box;">
            <span style="color: #444; white-space: nowrap; flex-shrink: 0; margin-right: 6px; min-width: 55px;">Contact</span>
            <span style="font-weight: bold; text-align: right; word-break: break-word; flex: 1;">${phone}</span>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: flex-start; width: 100%; padding: 2px 10px; font-size: 11px; box-sizing: border-box;">
            <span style="color: #444; white-space: nowrap; flex-shrink: 0; margin-right: 6px; min-width: 55px;">Address</span>
            <span style="font-weight: bold; text-align: right; word-break: break-word; flex: 1;">${address}</span>
          </div>
          ${hours ? `
          <div style="display: flex; justify-content: space-between; align-items: flex-start; width: 100%; padding: 2px 10px; font-size: 11px; box-sizing: border-box;">
            <span style="color: #444; white-space: nowrap; flex-shrink: 0; margin-right: 6px; min-width: 55px;">Hours</span>
            <span style="font-weight: bold; text-align: right; word-break: break-word; flex: 1;">${hours}</span>
          </div>` : ''}

          <div style="border-top: 1px dashed #000; width: calc(100% - 20px); margin: 3px 10px; box-sizing: border-box;"></div>
          <div style="text-align: center; font-size: 9px; color: #777; padding: 5px 0 10px 0; width: 100%; box-sizing: border-box;">Powered by ClinicToken CMS</div>
        </div>
      </div>
    `;

    document.body.appendChild(container);

    // Wait for the DOM to process the appended element
    setTimeout(() => {
      html2canvas(container.firstElementChild as HTMLElement, { 
        scale: 2, 
        useCORS: true, 
        logging: false,
        backgroundColor: '#ffffff'
      }).then(canvas => {
        const imgData = canvas.toDataURL('image/png');
        
        // 80mm thermal receipt standard width
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: [80, (canvas.height * 80) / canvas.width]
        });
        
        pdf.addImage(imgData, 'PNG', 0, 0, 80, (canvas.height * 80) / canvas.width);
        pdf.save(`online-token-${tokenData.token_number}.pdf`);
        
        document.body.removeChild(container);
        resolve();
      }).catch(err => {
        console.error('Error generating PDF:', err);
        document.body.removeChild(container);
        reject(err);
      });
    }, 100);
  });
}
