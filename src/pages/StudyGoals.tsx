import { AppSidebar } from "@/components/app-sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { 
  Target,
  Plus,
  Calendar,
  CheckCircle2,
  Clock,
  TrendingUp,
  X
} from "lucide-react"
import { useEffect, useState, useRef } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { getCurrentUser } from "@/api/auth-utils"
import { toast } from "sonner"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { EnrollmentsAPI } from "@/api/enrollments.api"
import { ProgressAPI } from "@/api/progress.api"

interface StudyGoal {
  id: string
  title: string
  type: 'hours' | 'courses' | 'lessons'
  target: number
  current: number
  period: 'daily' | 'weekly' | 'monthly'
  startDate: string
  endDate: string
  completed: boolean
}

export function StudyGoals() {
  const currentUser = getCurrentUser()
  const [loading, setLoading] = useState(true)
  const [goals, setGoals] = useState<StudyGoal[]>([])
  const [showNewGoalForm, setShowNewGoalForm] = useState(false)
  const [newGoal, setNewGoal] = useState({
    title: '',
    type: 'hours' as 'hours' | 'courses' | 'lessons',
    target: 1,
    period: 'weekly' as 'daily' | 'weekly' | 'monthly',
  })
  const [stats, setStats] = useState({
    totalGoals: 0,
    completedGoals: 0,
    activeGoals: 0,
  })
  const hasFetched = useRef(false)

  useEffect(() => {
    if (hasFetched.current) return
    hasFetched.current = true
    loadGoals()
    calculateStats()
  }, [])

  useEffect(() => {
    calculateStats()
  }, [goals])

  const loadGoals = () => {
    try {
      setLoading(true)
      const key = `study_goals_${currentUser?.id}`
      const data = localStorage.getItem(key)
      if (data) {
        const parsed = JSON.parse(data)
        setGoals(parsed)
      } else {
        setGoals([])
      }
    } catch (error) {
      console.error('Failed to load goals:', error)
      setGoals([])
    } finally {
      setLoading(false)
    }
  }

  const saveGoals = () => {
    try {
      const key = `study_goals_${currentUser?.id}`
      localStorage.setItem(key, JSON.stringify(goals))
    } catch (error) {
      console.error('Failed to save goals:', error)
    }
  }

  useEffect(() => {
    if (hasFetched.current) {
      saveGoals()
      updateGoalProgress()
    }
  }, [goals])

  const updateGoalProgress = async () => {
    try {
      const enrollments = await EnrollmentsAPI.getEnrollments({ limit: 100 })
      const updatedGoals = goals.map(goal => {
        let current = 0
        if (goal.type === 'courses') {
          current = enrollments.enrollments?.length || 0
        } else if (goal.type === 'lessons') {
          // Would need to count completed lessons
          current = 0
        } else {
          // hours - would need time tracking
          current = 0
        }
        return { ...goal, current }
      })
      setGoals(updatedGoals)
    } catch (error) {
      // Ignore errors
    }
  }

  const calculateStats = () => {
    setStats({
      totalGoals: goals.length,
      completedGoals: goals.filter(g => g.completed).length,
      activeGoals: goals.filter(g => !g.completed).length,
    })
  }

  const handleCreateGoal = () => {
    if (!newGoal.title.trim() || newGoal.target <= 0) {
      toast.error('Please fill in all fields')
      return
    }

    const now = new Date()
    let endDate = new Date(now)
    
    switch (newGoal.period) {
      case 'daily':
        endDate.setDate(endDate.getDate() + 1)
        break
      case 'weekly':
        endDate.setDate(endDate.getDate() + 7)
        break
      case 'monthly':
        endDate.setMonth(endDate.getMonth() + 1)
        break
    }

    const goal: StudyGoal = {
      id: Date.now().toString(),
      title: newGoal.title.trim(),
      type: newGoal.type,
      target: newGoal.target,
      current: 0,
      period: newGoal.period,
      startDate: now.toISOString(),
      endDate: endDate.toISOString(),
      completed: false,
    }

    setGoals(prev => [...prev, goal])
    setShowNewGoalForm(false)
    setNewGoal({
      title: '',
      type: 'hours',
      target: 1,
      period: 'weekly',
    })
    toast.success('Goal created successfully')
  }

  const handleDeleteGoal = (goalId: string) => {
    setGoals(prev => prev.filter(g => g.id !== goalId))
    toast.success('Goal deleted')
  }

  const getGoalProgress = (goal: StudyGoal) => {
    return Math.min((goal.current / goal.target) * 100, 100)
  }

  const getDaysRemaining = (endDate: string) => {
    const end = new Date(endDate)
    const now = new Date()
    const diff = end.getTime() - now.getTime()
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24))
    return days > 0 ? days : 0
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'hours':
        return 'Hours'
      case 'courses':
        return 'Courses'
      case 'lessons':
        return 'Lessons'
      default:
        return type
    }
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-6">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage>Study Goals</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <div className="flex flex-1 flex-col p-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-4xl font-bold tracking-tight mb-2">Study Goals</h1>
                <p className="text-lg text-muted-foreground">
                  Set and track your learning objectives
                </p>
              </div>
              <Button onClick={() => setShowNewGoalForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                New Goal
              </Button>
            </div>
          </div>

          {/* Stats */}
          {stats.totalGoals > 0 && (
            <div className="grid gap-4 md:grid-cols-3 mb-8">
              <Card>
                <CardContent className="p-6">
                  <div className="text-2xl font-bold">{stats.totalGoals}</div>
                  <div className="text-sm text-muted-foreground mt-1">Total Goals</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="text-2xl font-bold text-green-600">{stats.completedGoals}</div>
                  <div className="text-sm text-muted-foreground mt-1">Completed</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="text-2xl font-bold text-blue-600">{stats.activeGoals}</div>
                  <div className="text-sm text-muted-foreground mt-1">Active</div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* New Goal Form */}
          {showNewGoalForm && (
            <Card className="mb-8 border-2">
              <CardHeader>
                <CardTitle>Create New Goal</CardTitle>
                <CardDescription>Set a learning objective to track your progress</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Goal Title</label>
                  <Input
                    placeholder="e.g., Complete 3 courses this month"
                    value={newGoal.title}
                    onChange={(e) => setNewGoal(prev => ({ ...prev, title: e.target.value }))}
                  />
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Type</label>
                    <Select
                      value={newGoal.type}
                      onValueChange={(v) => setNewGoal(prev => ({ ...prev, type: v as any }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hours">Hours</SelectItem>
                        <SelectItem value="courses">Courses</SelectItem>
                        <SelectItem value="lessons">Lessons</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Target</label>
                    <Input
                      type="number"
                      min="1"
                      value={newGoal.target}
                      onChange={(e) => setNewGoal(prev => ({ ...prev, target: parseInt(e.target.value) || 1 }))}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Period</label>
                    <Select
                      value={newGoal.period}
                      onValueChange={(v) => setNewGoal(prev => ({ ...prev, period: v as any }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleCreateGoal}>
                    Create Goal
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowNewGoalForm(false)
                      setNewGoal({
                        title: '',
                        type: 'hours',
                        target: 1,
                        period: 'weekly',
                      })
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Goals List */}
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <Skeleton className="h-6 w-3/4 mb-4" />
                    <Skeleton className="h-4 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : goals.length > 0 ? (
            <div className="space-y-4">
              {goals.map((goal) => {
                const progress = getGoalProgress(goal)
                const daysRemaining = getDaysRemaining(goal.endDate)
                const isCompleted = goal.completed || progress >= 100

                return (
                  <Card key={goal.id} className={isCompleted ? 'border-green-500' : ''}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Target className="h-5 w-5 text-primary" />
                            <CardTitle className="text-lg">{goal.title}</CardTitle>
                            {isCompleted && (
                              <CheckCircle2 className="h-5 w-5 text-green-600" />
                            )}
                          </div>
                          <CardDescription>
                            {getTypeLabel(goal.type)} • {goal.period} goal
                          </CardDescription>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteGoal(goal.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <div className="flex items-center justify-between text-sm mb-2">
                            <span className="text-muted-foreground">Progress</span>
                            <span className="font-medium">
                              {goal.current} / {goal.target} {getTypeLabel(goal.type).toLowerCase()}
                            </span>
                          </div>
                          <Progress value={progress} className="h-2" />
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span>
                              {daysRemaining > 0 
                                ? `${daysRemaining} days remaining`
                                : 'Goal period ended'
                              }
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            <span>
                              Started {new Date(goal.startDate).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          ) : (
            <Card className="py-16">
              <CardContent className="text-center">
                <Target className="h-20 w-20 mx-auto mb-6 text-muted-foreground/50" />
                <h3 className="text-2xl font-semibold mb-3">No goals yet</h3>
                <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                  Set learning goals to track your progress and stay motivated. You can set goals for hours studied, courses completed, or lessons finished.
                </p>
                <Button onClick={() => setShowNewGoalForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Goal
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

