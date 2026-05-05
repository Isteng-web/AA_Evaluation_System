import { useAuth } from '../lib/auth';
import * as React from 'react';
import { Button } from '../components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { LogOut, User, LayoutDashboard, ClipboardList, Settings, FileText, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Badge } from '../components/ui/badge';

interface Section {
  id: string;
  courseCode: string;
  courseName: string;
  sectionName: string;
  facultyId: string;
}

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (!user) return;
      try {
        // For Students: Show sections they need to evaluate
        // For simplicity, we fetch all sections in this demo or sections they are assigned to
        const sectionsRef = collection(db, 'sections');
        const q = query(sectionsRef); // In real app, filter by enrollment
        const querySnapshot = await getDocs(q);
        const fetched = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Section));
        setSections(fetched);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [user]);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#F0F0EE] font-sans text-[#141414]">
      {/* Header */}
      <header className="border-b border-[#141414] bg-white sticky top-0 z-10 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Link to="/" className="font-mono font-black text-xl tracking-tighter uppercase">SYSTEM_DASHBOARD</Link>
          <Badge variant="outline" className="rounded-none border-[#141414] font-mono text-[10px]">
            {user.role}
          </Badge>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right hidden md:block">
            <p className="text-xs font-mono font-bold uppercase">{user.displayName}</p>
            <p className="text-[10px] italic opacity-50">{user.email}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={logout} className="hover:bg-red-50 hover:text-red-600 border border-transparent hover:border-red-200">
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 md:p-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Sidebar / Navigation Cards */}
          <div className="md:col-span-1 space-y-4">
            <Card className="rounded-none border-2 border-[#141414] bg-white">
              <CardContent className="p-4 space-y-2">
                <p className="text-[10px] font-mono opacity-50 uppercase mb-4">Navigation</p>
                <NavItem icon={<LayoutDashboard className="w-4 h-4" />} label="Overview" active />
                {user.role === 'ADMIN' && (
                  <Link to="/admin">
                    <NavItem icon={<Settings className="w-4 h-4" />} label="Admin Management" />
                  </Link>
                )}
                {(user.role === 'ADMIN' || user.role === 'FACULTY') && (
                  <Link to="/reports">
                    <NavItem icon={<FileText className="w-4 h-4" />} label="Evaluations" />
                  </Link>
                )}
              </CardContent>
            </Card>

            <Card className="rounded-none border-2 border-[#141414] bg-[#141414] text-white">
              <CardContent className="p-4">
                <p className="text-[10px] font-mono opacity-50 uppercase mb-2">Academic Period</p>
                <p className="font-bold text-lg">2023-2024</p>
                <p className="font-serif italic text-sm">2nd Semester</p>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="md:col-span-3 space-y-6">
            <div className="flex justify-between items-end border-b border-[#141414] pb-4">
              <div>
                <h1 className="text-4xl font-mono font-black uppercase leading-none">Evaluation Queue</h1>
                <p className="font-serif italic text-lg opacity-60 mt-1">Pending and submitted surveys for this period.</p>
              </div>
            </div>

            {loading ? (
              <div className="py-20 text-center font-mono italic animate-pulse">Scanning database...</div>
            ) : sections.length > 0 ? (
              <div className="grid gap-4">
                {sections.map((section) => (
                  <div 
                    key={section.id} 
                    className="group flex flex-col md:flex-row justify-between items-center bg-white border border-[#141414] p-6 hover:bg-[#141414] hover:text-white transition-all transition-duration-300 cursor-pointer"
                  >
                    <div>
                      <Badge variant="outline" className="mb-2 group-hover:border-white group-hover:text-white rounded-none font-mono text-[10px] px-1">
                        {section.courseCode}
                      </Badge>
                      <h3 className="text-xl font-bold font-mono uppercase">{section.courseName}</h3>
                      <p className="font-serif italic opacity-60 group-hover:opacity-100 flex items-center gap-2">
                        {section.sectionName} — Faculty ID: {section.facultyId}
                      </p>
                    </div>
                    <Link to={`/evaluate/${section.id}`} className="mt-4 md:mt-0">
                      <Button className="rounded-none bg-[#141414] group-hover:bg-white group-hover:text-[#141414] font-mono font-bold uppercase transition-all">
                        {user.role === 'STUDENT' ? 'Evaluate SET' : 'Evaluate SAF'}
                        <ChevronRight className="ml-2 w-4 h-4" />
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-20 text-center border-2 border-dashed border-[#141414] opacity-40">
                <p className="font-mono uppercase text-sm">No active sections found for your enrollment.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function NavItem({ icon, label, active = false }: { icon: React.ReactNode, label: string, active?: boolean }) {
  return (
    <div className={`flex items-center gap-3 p-2 font-mono text-sm uppercase font-bold cursor-pointer transition-all ${active ? 'bg-[#141414] text-white' : 'hover:bg-gray-100'}`}>
      {icon}
      {label}
    </div>
  );
}
