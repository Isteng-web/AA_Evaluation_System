import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useAuth } from '../lib/auth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { FileText, Printer, TrendingUp, Users, AlertCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { EVALUATION_ITEMS } from '../constants';

interface Evaluation {
  id: string;
  type: 'SET' | 'SAF';
  scores: number[];
  sectionId: string;
  targetFacultyId: string;
  evaluatorId: string;
}

interface Section {
  id: string;
  courseCode: string;
  courseName: string;
}

export default function FacultyReports() {
  const { user } = useAuth();
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (!user) return;
      try {
        const evalsRef = collection(db, 'evaluations');
        // If Faculty, only see own evaluations. If Admin, see all.
        const q = user.role === 'ADMIN' ? query(evalsRef) : query(evalsRef, where('targetFacultyId', '==', user.uid));
        
        const [evalsSnap, sectionsSnap] = await Promise.all([
          getDocs(q),
          getDocs(collection(db, 'sections'))
        ]);
        
        setEvaluations(evalsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Evaluation)));
        setSections(sectionsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Section)));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [user]);

  const calculateSectionStats = (sectionId: string) => {
    const sectionEvals = evaluations.filter(e => e.sectionId === sectionId && e.type === 'SET');
    if (sectionEvals.length === 0) return null;

    const totalPossiblePerEval = 75; // 15 items * 5 max
    const avgScores = Array(15).fill(0);
    
    sectionEvals.forEach(evalu => {
      evalu.scores.forEach((score, i) => {
        avgScores[i] += score;
      });
    });

    const finalAvgs = avgScores.map(sum => sum / sectionEvals.length);
    const overallSum = finalAvgs.reduce((a, b) => a + b, 0);
    const ratingPercentage = (overallSum / totalPossiblePerEval) * 100;

    return {
      count: sectionEvals.length,
      rating: ratingPercentage.toFixed(2),
      itemAvgs: finalAvgs
    };
  };

  const getWeightedAverage = () => {
    const sectionResults = sections.map(s => calculateSectionStats(s.id)).filter(Boolean) as {count: number, rating: string}[];
    if (sectionResults.length === 0) return "0.00";
    
    const totalStudents = sectionResults.reduce((acc, curr) => acc + curr.count, 0);
    const weightedSum = sectionResults.reduce((acc, curr) => acc + (curr.count * parseFloat(curr.rating)), 0);
    
    return (weightedSum / totalStudents).toFixed(2);
  };

  if (loading) return <div className="p-20 text-center font-mono animate-pulse italic">Aggregating Evaluation Data...</div>;

  const overallRating = parseFloat(getWeightedAverage());
  const ratingCategory = overallRating >= 90 ? 'Outstanding' : overallRating >= 80 ? 'Very Satisfactory' : overallRating >= 75 ? 'Satisfactory' : 'Needs Improvement';

  return (
    <div className="min-h-screen bg-[#F0F0EE] p-6 lg:p-12 font-sans text-[#141414]">
      <div className="max-w-6xl mx-auto space-y-12">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b-2 border-[#141414] pb-8">
          <div>
            <div className="flex items-center gap-2 font-mono text-xs uppercase font-bold opacity-40 mb-2">
              <FileText className="w-4 h-4" /> Faculty Performance Audit Report
            </div>
            <h1 className="text-6xl font-mono font-black uppercase tracking-tighter leading-none">ANNEX_C_SUMMARY</h1>
            <p className="font-serif italic text-xl mt-2 opacity-60">Complete performance evaluation summary for the current academic period.</p>
          </div>
          <Button className="rounded-none bg-[#141414] hover:bg-black text-white font-mono uppercase h-14 px-8 border-2 border-[#141414]">
            <Printer className="w-5 h-5 mr-2" /> Print_PDF_Report
          </Button>
        </header>

        {/* Executive Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="rounded-none border-2 border-[#141414] bg-[#141414] text-white shadow-[8px_8px_0px_0px_rgba(30,30,30,0.2)]">
            <CardHeader className="pb-2">
               <CardDescription className="text-gray-400 font-mono uppercase text-[10px] tracking-widest">Aggregate Performance</CardDescription>
               <CardTitle className="text-6xl font-mono font-black tracking-tighter">{overallRating}%</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge className="bg-white text-[#141414] rounded-none font-mono uppercase font-black px-4 py-1">{ratingCategory}</Badge>
            </CardContent>
          </Card>

          <Card className="rounded-none border-2 border-[#141414] bg-white">
            <CardHeader className="pb-2">
               <CardDescription className="font-mono uppercase text-[10px] tracking-widest text-[#141414] opacity-40">Student Participation</CardDescription>
               <CardTitle className="text-5xl font-mono font-black">{evaluations.filter(e => e.type === 'SET').length}</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center gap-2 text-green-600">
              <Users className="w-4 h-4" /> 
              <span className="font-mono text-xs font-bold uppercase tracking-tighter">Total Students Evaluated</span>
            </CardContent>
          </Card>

          <Card className="rounded-none border-2 border-[#141414] bg-white">
            <CardHeader className="pb-2">
               <CardDescription className="font-mono uppercase text-[10px] tracking-widest text-[#141414] opacity-40">Supervisor Audit</CardDescription>
               <CardTitle className="text-5xl font-mono font-black">
                 {evaluations.filter(e => e.type === 'SAF').length > 0 ? "DONE" : "PENDING"}
               </CardTitle>
            </CardHeader>
            <CardContent className="flex items-center gap-2 text-orange-600">
              <TrendingUp className="w-4 h-4" /> 
              <span className="font-mono text-xs font-bold uppercase tracking-tighter">B_Annex SAF Verification</span>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Breakdown */}
        <div className="space-y-6">
           <h2 className="text-3xl font-mono font-black uppercase border-b-2 border-[#141414] inline-block pr-8 pb-2">Institutional Benchmarks</h2>
           <Card className="rounded-none border-2 border-[#141414] bg-white overflow-hidden">
             <Table>
                <TableHeader className="bg-[#141414]">
                  <TableRow className="hover:bg-[#141414]">
                    <TableHead className="text-white font-mono uppercase font-black h-12 w-16 text-center">ID</TableHead>
                    <TableHead className="text-white font-mono uppercase font-black h-12">Performance Dimension</TableHead>
                    <TableHead className="text-white font-mono uppercase font-black h-12 text-center w-24">Mean Scale</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {EVALUATION_ITEMS.map((item) => {
                    const allScores = evaluations
                      .filter(e => e.type === 'SET')
                      .map(e => e.scores[item.id - 1])
                      .filter(s => s !== undefined);
                    const avg = allScores.length > 0 ? (allScores.reduce((a, b) => a + b, 0) / allScores.length).toFixed(2) : 'N/A';

                    return (
                      <TableRow key={item.id} className="border-b border-[#141414] hover:bg-gray-50">
                        <TableCell className="font-mono font-bold text-center opacity-30">{String(item.id).padStart(2, '0')}</TableCell>
                        <TableCell className="py-4">
                          <p className="text-[10px] font-mono uppercase font-bold opacity-40 mb-0.5">{item.category}</p>
                          <p className="font-medium text-lg leading-tight">{item.text}</p>
                        </TableCell>
                        <TableCell className="text-center font-mono font-black text-2xl">{avg}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
             </Table>
           </Card>
        </div>

        {/* Qualitative Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card className="rounded-none border-2 border-[#141414] bg-white">
            <CardHeader className="bg-gray-100 border-b border-[#141414]">
              <CardTitle className="font-mono uppercase font-black">Student Comments</CardTitle>
            </CardHeader>
            <CardContent className="p-0 max-h-[400px] overflow-auto divide-y divide-gray-100">
              {evaluations.filter(e => e.type === 'SET' && e.comments).map((e, i) => (
                <div key={i} className="p-6">
                  <p className="font-serif italic text-lg leading-relaxed opacity-80">"{e.comments}"</p>
                </div>
              ))}
              {evaluations.filter(e => e.type === 'SET' && e.comments).length === 0 && (
                <div className="p-12 text-center opacity-40 italic font-serif">No qualitative feedback submitted.</div>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-none border-2 border-[#141414] bg-[#141414] text-white">
            <CardHeader className="border-b border-gray-800">
              <CardTitle className="font-mono uppercase font-black">Development Plan (Annex D)</CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
               <div className="flex items-start gap-4">
                  <AlertCircle className="w-8 h-8 text-orange-500 shrink-0" />
                  <div>
                    <h3 className="font-mono font-bold uppercase text-lg">Action Items</h3>
                    <p className="text-sm opacity-60 font-serif italic">Based on the current evaluation cycle, the following focus areas are suggested for professional development.</p>
                  </div>
               </div>
               <div className="space-y-4 font-mono text-sm uppercase">
                 <div className="flex gap-4 items-center border-l-4 border-orange-500 pl-4 h-12 bg-white/5">
                   01. Enhance Digital Pedagogy Integration
                 </div>
                 <div className="flex gap-4 items-center border-l-4 border-white pl-4 h-12 bg-white/5 opacity-50">
                   02. Optimize Feedback Turnaround Cycle
                 </div>
               </div>
               <Button className="w-full bg-white text-[#141414] hover:bg-gray-200 rounded-none font-mono uppercase font-black py-8 mt-4">
                 Sign_Acknowledgement_Form
               </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
