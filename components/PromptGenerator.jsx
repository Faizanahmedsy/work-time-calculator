"use client";
import { useState } from "react";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Badge } from "./ui/badge";
import { X, Sparkles, Copy, Check } from "lucide-react";
import { ScrollArea } from "./ui/scroll-area";

const roles = [
  { value: "frontend", label: "Frontend Engineer" },
  { value: "backend", label: "Backend Engineer" },
  { value: "fullstack", label: "Full Stack Engineer" },
  { value: "devops", label: "DevOps Engineer" },
  { value: "mobile", label: "Mobile Developer" },
  { value: "data-scientist", label: "Data Scientist" },
  { value: "ml-engineer", label: "ML Engineer" },
  { value: "security", label: "Security Engineer" },
  { value: "qa", label: "QA Engineer" },
  { value: "architect", label: "Software Architect" },
];

const skills = [
  { value: "system-design", label: "System Design" },
  { value: "api-design", label: "API Design" },
  { value: "database", label: "Database Design" },
  { value: "testing", label: "Testing & TDD" },
  { value: "performance", label: "Performance Optimization" },
  { value: "security", label: "Security Best Practices" },
  { value: "clean-code", label: "Clean Code" },
  { value: "design-patterns", label: "Design Patterns" },
  { value: "microservices", label: "Microservices" },
  { value: "cloud", label: "Cloud Architecture" },
  { value: "ci-cd", label: "CI/CD" },
  { value: "documentation", label: "Documentation" },
  { value: "code-review", label: "Code Review" },
  { value: "debugging", label: "Debugging" },
  { value: "refactoring", label: "Refactoring" },
];

const frameworks_list = [
  { value: "react", label: "React" },
  { value: "nextjs", label: "Next.js" },
  { value: "vue", label: "Vue.js" },
  { value: "angular", label: "Angular" },
  { value: "nodejs", label: "Node.js" },
  { value: "python", label: "Python" },
  { value: "django", label: "Django" },
  { value: "fastapi", label: "FastAPI" },
  { value: "spring", label: "Spring Boot" },
  { value: "dotnet", label: ".NET" },
  { value: "rust", label: "Rust" },
  { value: "golang", label: "Go" },
  { value: "postgresql", label: "PostgreSQL" },
  { value: "mongodb", label: "MongoDB" },
  { value: "redis", label: "Redis" },
  { value: "docker", label: "Docker" },
  { value: "kubernetes", label: "Kubernetes" },
  { value: "aws", label: "AWS" },
  { value: "azure", label: "Azure" },
  { value: "gcp", label: "GCP" },
];

export function PromptGenerator() {
  const [selectedRole, setSelectedRole] = useState("");
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [selectedFrameworks, setSelectedFrameworks] = useState([]);
  const [chainOfThought, setChainOfThought] = useState(false);
  const [treeOfThought, setTreeOfThought] = useState(false);
  const [temperature, setTemperature] = useState("0.7");
  const [topP, setTopP] = useState("0.9");
  const [topK, setTopK] = useState("50");
  const [generatedPrompt, setGeneratedPrompt] = useState("");
  const [copied, setCopied] = useState(false);

  const addSkill = (skill) => {
    if (!selectedSkills.includes(skill)) {
      setSelectedSkills([...selectedSkills, skill]);
    }
  };

  const removeSkill = (skill) => {
    setSelectedSkills(selectedSkills.filter((s) => s !== skill));
  };

  const addFramework = (framework) => {
    if (!selectedFrameworks.includes(framework)) {
      setSelectedFrameworks([...selectedFrameworks, framework]);
    }
  };

  const removeFramework = (framework) => {
    setSelectedFrameworks(selectedFrameworks.filter((f) => f !== framework));
  };

  const generatePrompt = () => {
    if (!selectedRole) {
      return;
    }

    const roleObj = roles.find((r) => r.value === selectedRole);
    const roleName = roleObj ? roleObj.label : selectedRole;

    let prompt = `You are an expert ${roleName} with deep knowledge and extensive practical experience.\n\n`;

    if (selectedSkills.length > 0) {
      const skillLabels = selectedSkills.map(
        (skill) => skills.find((s) => s.value === skill)?.label || skill
      );
      prompt += `## Core Competencies\n`;
      prompt += `Focus on these key areas:\n`;
      skillLabels.forEach((skill) => {
        prompt += `- ${skill}\n`;
      });
      prompt += `\n`;
    }

    if (selectedFrameworks.length > 0) {
      const frameworkLabels = selectedFrameworks.map(
        (fw) => frameworks_list.find((f) => f.value === fw)?.label || fw
      );
      prompt += `## Technology Stack\n`;
      prompt += `Primary technologies and frameworks:\n`;
      frameworkLabels.forEach((fw) => {
        prompt += `- ${fw}\n`;
      });
      prompt += `\n`;
    }

    prompt += `## Response Guidelines\n`;

    if (chainOfThought) {
      prompt += `- Use Chain of Thought reasoning: Break down complex problems step-by-step before providing solutions\n`;
    }

    if (treeOfThought) {
      prompt += `- Apply Tree of Thought exploration: Consider multiple approaches and evaluate trade-offs\n`;
    }

    prompt += `- Provide clear, actionable solutions with practical examples\n`;
    prompt += `- Explain the reasoning behind your recommendations\n`;
    prompt += `- Include best practices and potential pitfalls to avoid\n`;
    prompt += `- Consider edge cases and scalability implications\n`;

    if (temperature || topP || topK) {
      prompt += `\n## Generation Parameters\n`;
      if (temperature) {
        prompt += `- Temperature: ${temperature} (creativity level)\n`;
      }
      if (topP) {
        prompt += `- Top P: ${topP} (nucleus sampling)\n`;
      }
      if (topK) {
        prompt += `- Top K: ${topK} (token selection)\n`;
      }
    }

    prompt += `\n## Task\n`;
    prompt += `[Describe your specific task or question here]\n\n`;
    prompt += `Please provide a comprehensive solution following the guidelines above.`;

    setGeneratedPrompt(prompt);
  };

  const copyToClipboard = async () => {
    if (generatedPrompt) {
      await navigator.clipboard.writeText(generatedPrompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const resetForm = () => {
    setSelectedRole("");
    setSelectedSkills([]);
    setSelectedFrameworks([]);
    setChainOfThought(false);
    setTreeOfThought(false);
    setTemperature("0.7");
    setTopP("0.9");
    setTopK("50");
    setGeneratedPrompt("");
  };

  return (
    <div className="w-full max-w-4xl px-4 py-8">
      <Card className="bg-gray-800/10 backdrop-blur-md border border-gray-700 text-white rounded-3xl shadow-2xl">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center flex items-center justify-center gap-2">
            <Sparkles className="h-6 w-6 text-purple-400" />
            Master Prompt Generator
          </CardTitle>
          <CardDescription className="text-gray-400 text-center">
            Generate highly customized prompts for AI assistance
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Role Selection */}
          <div className="space-y-2">
            <Label htmlFor="role" className="text-sm font-medium text-gray-200">
              Select Your Role
            </Label>
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger className="w-full bg-gray-700/50 border-gray-600 text-white rounded-xl">
                <SelectValue placeholder="Choose your engineering role" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-600">
                {roles.map((role) => (
                  <SelectItem
                    key={role.value}
                    value={role.value}
                    className="text-white focus:bg-gray-700"
                  >
                    {role.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Skills Selection */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-200">
              Select Skills & Focus Areas
            </Label>
            <Select onValueChange={addSkill}>
              <SelectTrigger className="w-full bg-gray-700/50 border-gray-600 text-white rounded-xl">
                <SelectValue placeholder="Add skills (select multiple)" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-600">
                {skills
                  .filter((skill) => !selectedSkills.includes(skill.value))
                  .map((skill) => (
                    <SelectItem
                      key={skill.value}
                      value={skill.value}
                      className="text-white focus:bg-gray-700"
                    >
                      {skill.label}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            {selectedSkills.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {selectedSkills.map((skill) => {
                  const skillObj = skills.find((s) => s.value === skill);
                  return (
                    <Badge
                      key={skill}
                      variant="secondary"
                      className="bg-purple-600/30 text-purple-200 hover:bg-purple-600/50 cursor-pointer rounded-full"
                      onClick={() => removeSkill(skill)}
                    >
                      {skillObj?.label}
                      <X className="h-3 w-3 ml-1" />
                    </Badge>
                  );
                })}
              </div>
            )}
          </div>

          {/* Frameworks Selection */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-200">
              Select Technologies & Frameworks
            </Label>
            <Select onValueChange={addFramework}>
              <SelectTrigger className="w-full bg-gray-700/50 border-gray-600 text-white rounded-xl">
                <SelectValue placeholder="Add technologies (select multiple)" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-600">
                {frameworks_list
                  .filter((fw) => !selectedFrameworks.includes(fw.value))
                  .map((fw) => (
                    <SelectItem
                      key={fw.value}
                      value={fw.value}
                      className="text-white focus:bg-gray-700"
                    >
                      {fw.label}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            {selectedFrameworks.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {selectedFrameworks.map((fw) => {
                  const fwObj = frameworks_list.find((f) => f.value === fw);
                  return (
                    <Badge
                      key={fw}
                      variant="secondary"
                      className="bg-blue-600/30 text-blue-200 hover:bg-blue-600/50 cursor-pointer rounded-full"
                      onClick={() => removeFramework(fw)}
                    >
                      {fwObj?.label}
                      <X className="h-3 w-3 ml-1" />
                    </Badge>
                  );
                })}
              </div>
            )}
          </div>

          {/* Advanced Options */}
          <div className="space-y-4 pt-4 border-t border-gray-700">
            <Label className="text-sm font-medium text-gray-200">
              Advanced Generation Options
            </Label>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="chainOfThought"
                  checked={chainOfThought}
                  onChange={(e) => setChainOfThought(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-purple-600 focus:ring-purple-500"
                />
                <Label
                  htmlFor="chainOfThought"
                  className="text-sm text-gray-300 cursor-pointer"
                >
                  Chain of Thought
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="treeOfThought"
                  checked={treeOfThought}
                  onChange={(e) => setTreeOfThought(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-purple-600 focus:ring-purple-500"
                />
                <Label
                  htmlFor="treeOfThought"
                  className="text-sm text-gray-300 cursor-pointer"
                >
                  Tree of Thought
                </Label>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="temperature" className="text-xs text-gray-400">
                  Temperature
                </Label>
                <Select value={temperature} onValueChange={setTemperature}>
                  <SelectTrigger className="w-full bg-gray-700/50 border-gray-600 text-white rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-600">
                    <SelectItem
                      value="0.2"
                      className="text-white focus:bg-gray-700"
                    >
                      0.2
                    </SelectItem>
                    <SelectItem
                      value="0.5"
                      className="text-white focus:bg-gray-700"
                    >
                      0.5
                    </SelectItem>
                    <SelectItem
                      value="0.7"
                      className="text-white focus:bg-gray-700"
                    >
                      0.7
                    </SelectItem>
                    <SelectItem
                      value="0.9"
                      className="text-white focus:bg-gray-700"
                    >
                      0.9
                    </SelectItem>
                    <SelectItem
                      value="1.0"
                      className="text-white focus:bg-gray-700"
                    >
                      1.0
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="topP" className="text-xs text-gray-400">
                  Top P
                </Label>
                <Select value={topP} onValueChange={setTopP}>
                  <SelectTrigger className="w-full bg-gray-700/50 border-gray-600 text-white rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-600">
                    <SelectItem
                      value="0.5"
                      className="text-white focus:bg-gray-700"
                    >
                      0.5
                    </SelectItem>
                    <SelectItem
                      value="0.7"
                      className="text-white focus:bg-gray-700"
                    >
                      0.7
                    </SelectItem>
                    <SelectItem
                      value="0.9"
                      className="text-white focus:bg-gray-700"
                    >
                      0.9
                    </SelectItem>
                    <SelectItem
                      value="0.95"
                      className="text-white focus:bg-gray-700"
                    >
                      0.95
                    </SelectItem>
                    <SelectItem
                      value="1.0"
                      className="text-white focus:bg-gray-700"
                    >
                      1.0
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="topK" className="text-xs text-gray-400">
                  Top K
                </Label>
                <Select value={topK} onValueChange={setTopK}>
                  <SelectTrigger className="w-full bg-gray-700/50 border-gray-600 text-white rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-600">
                    <SelectItem
                      value="10"
                      className="text-white focus:bg-gray-700"
                    >
                      10
                    </SelectItem>
                    <SelectItem
                      value="25"
                      className="text-white focus:bg-gray-700"
                    >
                      25
                    </SelectItem>
                    <SelectItem
                      value="50"
                      className="text-white focus:bg-gray-700"
                    >
                      50
                    </SelectItem>
                    <SelectItem
                      value="75"
                      className="text-white focus:bg-gray-700"
                    >
                      75
                    </SelectItem>
                    <SelectItem
                      value="100"
                      className="text-white focus:bg-gray-700"
                    >
                      100
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={generatePrompt}
              disabled={!selectedRole}
              className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Generate Master Prompt
            </Button>
            <Button
              onClick={resetForm}
              variant="outline"
              className="rounded-full border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              Reset
            </Button>
          </div>

          {/* Generated Prompt Output */}
          {generatedPrompt && (
            <div className="space-y-3 pt-4 border-t border-gray-700">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium text-gray-200">
                  Generated Prompt
                </Label>
                <Button
                  onClick={copyToClipboard}
                  size="sm"
                  variant="ghost"
                  className="text-gray-400 hover:text-white hover:bg-gray-700 rounded-full"
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 mr-1" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-1" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
              <ScrollArea className="h-64 w-full rounded-xl p-4 bg-gray-900/50 border border-gray-700">
                <pre className="whitespace-pre-wrap text-sm text-gray-300 font-mono">
                  {generatedPrompt}
                </pre>
              </ScrollArea>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
