import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Plus, Trash2, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface Student {
  id: string;
  name: string;
}

export default function CreateClass() {
  const navigate = useNavigate();
  const [className, setClassName] = useState("");
  const [students, setStudents] = useState<Student[]>([]);
  const [newStudentName, setNewStudentName] = useState("");

  const addStudent = () => {
    if (newStudentName.trim()) {
      setStudents([...students, { id: Date.now().toString(), name: newStudentName.trim() }]);
      setNewStudentName("");
    }
  };

  const removeStudent = (id: string) => {
    setStudents(students.filter(s => s.id !== id));
  };

  const loadSampleClass = () => {
    const sampleNames = [
      "Emma Johnson", "Liam Smith", "Olivia Brown", "Noah Davis", "Ava Wilson",
      "Ethan Martinez", "Sophia Anderson", "Mason Taylor", "Isabella Thomas", "Logan Moore",
      "Mia Jackson", "Lucas White", "Charlotte Harris", "Aiden Martin", "Amelia Thompson",
      "Caden Garcia", "Harper Rodriguez", "Elijah Lewis", "Evelyn Lee", "James Walker",
      "Abigail Hall", "Benjamin Allen", "Emily Young", "William King", "Elizabeth Wright",
      "Michael Lopez", "Sofia Hill", "Alexander Scott", "Ella Green", "Daniel Adams"
    ];
    setStudents(sampleNames.map((name, i) => ({ id: i.toString(), name })));
    setClassName("Demo Class 2024");
    toast.success("Sample class loaded with 30 students");
  };

  const proceedToAssessment = () => {
    if (!className.trim()) {
      toast.error("Please enter a class name");
      return;
    }
    if (students.length === 0) {
      toast.error("Please add at least one student");
      return;
    }
    
    // Store class data
    localStorage.setItem("currentClass", JSON.stringify({ className, students }));
    navigate("/assessment");
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">Create Class</h1>
          <p className="text-muted-foreground">Set up your classroom to begin assessment</p>
        </div>
        <Button onClick={loadSampleClass} variant="outline" size="lg" className="rounded-xl">
          <Users className="w-4 h-4 mr-2" />
          Load Sample Class
        </Button>
      </div>

      <Card className="p-6 rounded-2xl shadow-sm">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Class Name</label>
            <Input
              value={className}
              onChange={(e) => setClassName(e.target.value)}
              placeholder="e.g., Grade 5 Mathematics"
              className="rounded-xl"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Add Students</label>
            <div className="flex gap-2">
              <Input
                value={newStudentName}
                onChange={(e) => setNewStudentName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addStudent()}
                placeholder="Enter student name"
                className="rounded-xl"
              />
              <Button onClick={addStudent} className="rounded-xl">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {students.length > 0 && (
        <Card className="p-6 rounded-2xl shadow-sm">
          <h3 className="font-semibold text-foreground mb-4">
            Students ({students.length})
          </h3>
          <div className="grid grid-cols-2 gap-3 max-h-96 overflow-y-auto">
            {students.map((student) => (
              <div
                key={student.id}
                className="flex items-center justify-between p-3 rounded-xl bg-secondary"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-info flex items-center justify-center text-white text-sm font-semibold">
                    {student.name.split(" ").map(n => n[0]).join("")}
                  </div>
                  <span className="text-sm font-medium">{student.name}</span>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => removeStudent(student.id)}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      <div className="flex justify-end">
        <Button
          size="lg"
          onClick={proceedToAssessment}
          disabled={!className || students.length === 0}
          className="rounded-xl px-8"
        >
          Proceed to Assessment
        </Button>
      </div>
    </div>
  );
}
