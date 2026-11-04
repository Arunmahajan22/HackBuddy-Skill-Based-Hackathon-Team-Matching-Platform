import { useState, useEffect, useCallback } from 'react';
import api from '../lib/api';
import { LandingNavbar } from '../components/landing/LandingNavbar';
import { HeroSection } from '../components/landing/HeroSection';
import { StatsSection } from '../components/landing/StatsSection';
import { ProblemSolutionSection } from '../components/landing/ProblemSolutionSection';
import { HowItWorksSection } from '../components/landing/HowItWorksSection';
import { FeaturedOpeningsSection } from '../components/landing/FeaturedOpeningsSection';
import { FeaturedBuildersSection } from '../components/landing/FeaturedBuildersSection';
import { SkillCategoriesSection } from '../components/landing/SkillCategoriesSection';
import { FeatureGridSection } from '../components/landing/FeatureGridSection';
import { CallToActionSection } from '../components/landing/CallToActionSection';
import { LandingFooter } from '../components/landing/LandingFooter';
import { JoinRequestModal } from '../components/JoinRequestModal';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import { useNavigate } from 'react-router-dom';

export default function LandingPage() {
  const { user } = useAuth();
  const { toast } = useSocket();
  const navigate = useNavigate();

  const [statsData, setStatsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedTeam, setSelectedTeam] = useState(null);

  const fetchStats = useCallback(async () => {
    try {
      const { data } = await api.get('/stats');
      if (data.success) {
        setStatsData(data);
      }
    } catch (err) {
      console.error('Failed to load live platform stats:', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleRequestTeam = (team) => {
    if (!user) {
      navigate('/login');
      return;
    }
    setSelectedTeam(team);
  };

  const handleRequestSuccess = () => {
    const teamName = selectedTeam?.hackathonName || 'the team';
    setSelectedTeam(null);
    toast('success', `Join request submitted for ${teamName}!`);
    fetchStats();
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 transition-colors duration-200 dark:bg-ink-950 dark:text-slate-100 flex flex-col justify-between">
      {/* Landing Navigation Header */}
      <LandingNavbar />

      <main className="flex-1">
        {/* 1. Hero Section */}
        <HeroSection
          featuredTeam={statsData?.featuredTeams?.[0]}
          stats={statsData?.stats}
          loading={loading}
        />

        {/* 2. Live Dynamic Statistics */}
        <StatsSection stats={statsData?.stats} loading={loading} />

        {/* 3. Problem vs Solution Comparison */}
        <ProblemSolutionSection />

        {/* 4. How It Works (4 Steps) */}
        <HowItWorksSection />

        {/* 5. Live Featured Team Openings */}
        <FeaturedOpeningsSection
          teams={statsData?.featuredTeams}
          loading={loading}
          onRequestTeam={handleRequestTeam}
        />

        {/* 6. Dynamic Skill Categories Cloud */}
        <SkillCategoriesSection skills={statsData?.topSkills} loading={loading} />

        {/* 7. Featured Verified Builders */}
        <FeaturedBuildersSection
          builders={statsData?.featuredBuilders}
          loading={loading}
        />

        {/* 8. Technical Architecture Feature Grid */}
        <FeatureGridSection />

        {/* 9. High-Impact Call to Action Banner */}
        <CallToActionSection />
      </main>

      {/* 10. Comprehensive SaaS Footer */}
      <LandingFooter />

      {/* Join Request Modal */}
      {selectedTeam && (
        <JoinRequestModal
          team={selectedTeam}
          onClose={() => setSelectedTeam(null)}
          onSuccess={handleRequestSuccess}
        />
      )}
    </div>
  );
}
