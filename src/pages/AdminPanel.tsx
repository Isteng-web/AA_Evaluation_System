import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Plus, Trash2, Edit2, Users, BookOpen, Calendar, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';

export default function AdminPanel() {
  const [faculty, setFaculty] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [periods, setPeriods] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [newFaculty, setNewFaculty] = useState({ name: '', department: '', college: '', email: '', rank: '' });
  const [newSection, setNewSection] = useState({ courseCode: '', courseName: '', sectionName: '', facultyId: '', academicPeriodId: '' });

  useEffect(() => {
    async function fetchData() {
      try {
        const [facultySnap, sectionsSnap, periodsSnap] = await Promise.all([
          getDocs(collection(db, 'faculty')),
          getDocs(collection(db, 'sections')),
          getDocs(collection(db, 'academicPeriods'))
        ]);
        
        setFaculty(facultySnap.docs.map(d => ({ id: d.id, ...d.data() })));
        setSections(sectionsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        setPeriods(periodsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleCreateFaculty = async () => {
    if (!newFaculty.name || !newFaculty.department) return;
    try {
      const docRef = await addDoc(collection(db, 'faculty'), newFaculty);
      setFaculty([...faculty, { id: docRef.id, ...newFaculty }]);
      setNewFaculty({ name: '', department: '', college: '', email: '', rank: '' });
      toast.success("Faculty record created");
    } catch (err) { toast.error("Error creating faculty"); }
  };

  const handleCreateSection = async () => {
    if (!newSection.courseCode || !newSection.facultyId || !newSection.academicPeriodId) return;
    try {
      const docRef = await addDoc(collection(db, 'sections'), newSection);
      setSections([...sections, { id: docRef.id, ...newSection }]);
      setNewSection({ courseCode: '', courseName: '', sectionName: '', facultyId: '', academicPeriodId: '' });
      toast.success("Section created successfully");
    } catch (err) { toast.error("Error creating section"); }
  };

  const seedDemoData = async () => {
    try {
      // 1. Create Academic Period
      const period = { semester: '2nd Semester', academicYear: '2023-2024', isActive: true };
      const periodRef = await addDoc(collection(db, 'academicPeriods'), period);
      
      // 2. Create Faculty
      const fac = { name: 'Dr. Alan Turing', department: 'Computer Science', college: 'College of Engineering', email: 'turing@uni.edu', rank: 'Professor' };
      const facRef = await addDoc(collection(db, 'faculty'), fac);
      
      // 3. Create Section
      const sec = { 
        courseCode: 'CS101', 
        courseName: 'Intro to Computation', 
        sectionName: 'A1', 
        facultyId: facRef.id, 
        academicPeriodId: periodRef.id,
        studentCount: 30
      };
      await addDoc(collection(db, 'sections'), sec);
      
      toast.success("Demo data seeded!");
      window.location.reload();
    } catch (err) {
      toast.error("Error seeding data");
    }
  };

  if (loading) return <div className="p-20 text-center font-mono animate-pulse uppercase">ACCESSING_ADMIN_CORE...</div>;

  return (
    <div className="min-h-screen bg-[#F0F0EE] p-6 lg:p-12 font-sans text-[#141414]">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 text-[#141414] opacity-50 mb-1">
              <ShieldCheck className="w-4 h-4" />
              <span className="font-mono text-xs uppercase font-bold tracking-widest">Administrative Control Panel</span>
            </div>
            <h1 className="text-5xl font-mono font-black uppercase tracking-tighter leading-none">SYSTEM_MANAGEMENT</h1>
          </div>
          <div className="flex gap-2">
             <Button onClick={seedDemoData} variant="outline" className="border-2 border-[#141414] rounded-none font-mono text-xs font-bold uppercase hover:bg-[#141414] hover:text-white">Seed Demo Data</Button>
             <Badge variant="outline" className="border-2 border-[#141414] rounded-none px-4 py-2 bg-white font-mono uppercase font-bold">
               Faculty: {faculty.length}
             </Badge>
             <Badge variant="outline" className="border-2 border-[#141414] rounded-none px-4 py-2 bg-white font-mono uppercase font-bold">
               Sections: {sections.length}
             </Badge>
          </div>
        </header>

        <Tabs defaultValue="faculty" className="w-full">
          <TabsList className="bg-transparent border-b-2 border-[#141414] w-full justify-start rounded-none h-14 p-0">
            <TabsTrigger value="faculty" className="rounded-none h-full px-8 font-mono uppercase font-black data-[state=active]:bg-[#141414] data-[state=active]:text-white">
              <Users className="w-4 h-4 mr-2" /> Records
            </TabsTrigger>
            <TabsTrigger value="sections" className="rounded-none h-full px-8 font-mono uppercase font-black data-[state=active]:bg-[#141414] data-[state=active]:text-white">
              <BookOpen className="w-4 h-4 mr-2" /> Sections
            </TabsTrigger>
            <TabsTrigger value="periods" className="rounded-none h-full px-8 font-mono uppercase font-black data-[state=active]:bg-[#141414] data-[state=active]:text-white">
               <Calendar className="w-4 h-4 mr-2" /> Periods
            </TabsTrigger>
          </TabsList>

          <TabsContent value="faculty" className="pt-8 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <Card className="lg:col-span-1 rounded-none border-2 border-[#141414] bg-white h-fit">
                <CardHeader>
                  <CardTitle className="font-mono uppercase font-black">Register Faculty</CardTitle>
                  <CardDescription className="italic font-serif">Add a new academic official to the database.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="font-mono text-xs uppercase opacity-60">Full Name</Label>
                    <Input className="rounded-none border-2 border-[#141414]" value={newFaculty.name} onChange={e => setNewFaculty({...newFaculty, name: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-mono text-xs uppercase opacity-60">Department</Label>
                    <Input className="rounded-none border-2 border-[#141414]" value={newFaculty.department} onChange={e => setNewFaculty({...newFaculty, department: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-mono text-xs uppercase opacity-60">Email</Label>
                    <Input className="rounded-none border-2 border-[#141414]" type="email" value={newFaculty.email} onChange={e => setNewFaculty({...newFaculty, email: e.target.value})} />
                  </div>
                  <Button onClick={handleCreateFaculty} className="w-full rounded-none bg-[#141414] hover:bg-black text-white font-mono uppercase font-bold py-6">
                    <Plus className="w-4 h-4 mr-2" /> Deploy Record
                  </Button>
                </CardContent>
              </Card>

              <Card className="lg:col-span-2 rounded-none border-2 border-[#141414] bg-white">
                <CardContent className="p-0">
                  <Table>
                    <TableHeader className="bg-[#141414]">
                      <TableRow className="hover:bg-[#141414] border-b-2 border-[#141414]">
                        <TableHead className="text-white font-mono uppercase font-black h-12">Faculty_ID</TableHead>
                        <TableHead className="text-white font-mono uppercase font-black h-12">Name</TableHead>
                        <TableHead className="text-white font-mono uppercase font-black h-12">Department</TableHead>
                        <TableHead className="text-white font-mono uppercase font-black h-12 text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {faculty.map((f) => (
                        <TableRow key={f.id} className="border-b border-[#141414] hover:bg-gray-50">
                          <TableCell className="font-mono text-xs font-bold">{f.id.slice(0, 8)}</TableCell>
                          <TableCell className="font-black uppercase">{f.name}</TableCell>
                          <TableCell className="italic font-serif">{f.department}</TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="icon" className="hover:bg-[#141414] hover:text-white rounded-none"><Edit2 className="w-4 h-4" /></Button>
                            <Button variant="ghost" size="icon" className="hover:bg-red-600 hover:text-white rounded-none text-red-600"><Trash2 className="w-4 h-4" /></Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="sections" className="pt-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
               <Card className="lg:col-span-1 border-2 border-[#141414] rounded-none bg-white">
                  <CardHeader>
                    <CardTitle className="font-mono uppercase font-black text-2xl tracking-tighter">Initialize Section</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                       <Label className="font-mono text-xs uppercase font-bold">Course Code</Label>
                       <Input className="border-2 border-[#141414] rounded-none" value={newSection.courseCode} onChange={e => setNewSection({...newSection, courseCode: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                       <Label className="font-mono text-xs uppercase font-bold">Assign Faculty</Label>
                       <Select onValueChange={v => setNewSection({...newSection, facultyId: v})}>
                         <SelectTrigger className="border-2 border-[#141414] rounded-none">
                           <SelectValue placeholder="Select Faculty" />
                         </SelectTrigger>
                         <SelectContent>
                           {faculty.map(f => (
                             <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                           ))}
                         </SelectContent>
                       </Select>
                    </div>
                    <div className="space-y-2">
                       <Label className="font-mono text-xs uppercase font-bold">Academic Period</Label>
                       <Select onValueChange={v => setNewSection({...newSection, academicPeriodId: v})}>
                         <SelectTrigger className="border-2 border-[#141414] rounded-none">
                           <SelectValue placeholder="Select Period" />
                         </SelectTrigger>
                         <SelectContent>
                           {periods.map(p => (
                             <SelectItem key={p.id} value={p.id}>{p.semester} {p.academicYear}</SelectItem>
                           ))}
                         </SelectContent>
                       </Select>
                    </div>
                    <Button onClick={handleCreateSection} className="w-full mt-4 rounded-none bg-[#141414] py-6 font-mono uppercase font-black">
                      Deploy Section
                    </Button>
                  </CardContent>
               </Card>

               <Card className="lg:col-span-2 border-2 border-[#141414] rounded-none bg-white">
                 <Table>
                    <TableHeader className="bg-gray-100 border-b-2 border-[#141414]">
                      <TableRow>
                        <TableHead className="font-mono uppercase font-bold text-[#141414]">Section_Info</TableHead>
                        <TableHead className="font-mono uppercase font-bold text-[#141414]">Faculty</TableHead>
                        <TableHead className="font-mono uppercase font-bold text-[#141414]">Period</TableHead>
                        <TableHead />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sections.map(s => (
                        <TableRow key={s.id} className="border-b border-gray-200">
                          <TableCell>
                            <p className="font-mono font-black uppercase text-lg">{s.courseCode}</p>
                            <p className="text-xs font-serif italic opacity-60">{s.id}</p>
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {faculty.find(f => f.id === s.facultyId)?.name || 'UNASSIGNED'}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="border-[#141414] rounded-none font-mono text-[10px]">
                              {periods.find(p => p.id === s.academicPeriodId)?.semester || 'UNKNOWN'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                             <Button variant="ghost" size="icon" className="text-red-500 rounded-none"><Trash2 className="w-4 h-4" /></Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                 </Table>
               </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
