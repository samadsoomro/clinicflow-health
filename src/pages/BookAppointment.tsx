import { Calendar } from "lucide-react";

const BookAppointment = () => (
  <div className="min-h-[60vh] flex items-center justify-center px-4">
    <div className="text-center">
      <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
        <Calendar size={32} className="text-purple-500" />
      </div>
      <h2 className="text-2xl font-bold mb-2">Book an Appointment</h2>
      <p className="text-gray-500">Appointment booking coming soon.</p>
    </div>
  </div>
);
export default BookAppointment;
