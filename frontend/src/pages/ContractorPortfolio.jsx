import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Image, Star, Calendar, Edit2, Trash2, Eye, Award } from 'lucide-react';
import { useAuth } from '../App';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ContractorPortfolio = () => {
  const { contractorId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [contractor, setContractor] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [categories, setCategories] = useState([]);
  
  // Check if viewing own portfolio (no contractorId) or another's
  const isOwner = !contractorId || user?.id === contractorId;
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'renovation',
    images: [],
    before_images: [],
    after_images: [],
    client_name: '',
    client_testimonial: '',
    project_date: '',
    duration: '',
    cost_range: '',
    featured: false
  });

  useEffect(() => {
    // If viewing own portfolio (no contractorId) and not logged in, redirect
    if (!contractorId && !user) {
      navigate('/login');
      return;
    }
    fetchPortfolio();
    fetchCategories();
    if (contractorId) {
      fetchContractorDetails();
    }
  }, [contractorId]);

  const fetchPortfolio = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/portfolio/contractor/${contractorId || user?.id}`);
      setProjects(response.data || []);
    } catch (error) {
      console.error('Error fetching portfolio:', error);
    }
    setLoading(false);
  };

  const fetchContractorDetails = async () => {
    try {
      const response = await axios.get(`${API}/contractors/profile/${contractorId}`);
      setContractor(response.data);
    } catch (error) {
      console.error('Error fetching contractor:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${API}/portfolio/categories`);
      setCategories(response.data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleSubmit = async () => {
    try {
      if (selectedProject) {
        await axios.put(
          `${API}/portfolio/project/${selectedProject.id}?contractor_id=${user.id}`,
          formData
        );
      } else {
        await axios.post(`${API}/portfolio/project?contractor_id=${user.id}`, formData);
      }
      setShowForm(false);
      setSelectedProject(null);
      resetForm();
      fetchPortfolio();
    } catch (error) {
      console.error('Error saving project:', error);
    }
  };

  const handleDelete = async (projectId) => {
    if (!window.confirm('Are you sure you want to delete this project?')) return;
    try {
      await axios.delete(`${API}/portfolio/project/${projectId}?contractor_id=${user.id}`);
      fetchPortfolio();
    } catch (error) {
      console.error('Error deleting project:', error);
    }
  };

  const toggleFeatured = async (projectId) => {
    try {
      await axios.post(`${API}/portfolio/project/${projectId}/feature?contractor_id=${user.id}`);
      fetchPortfolio();
    } catch (error) {
      console.error('Error toggling featured:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      category: 'renovation',
      images: [],
      before_images: [],
      after_images: [],
      client_name: '',
      client_testimonial: '',
      project_date: '',
      duration: '',
      cost_range: '',
      featured: false
    });
  };

  const editProject = (project) => {
    setSelectedProject(project);
    setFormData({
      title: project.title,
      description: project.description,
      category: project.category,
      images: project.images || [],
      before_images: project.before_images || [],
      after_images: project.after_images || [],
      client_name: project.client_name || '',
      client_testimonial: project.client_testimonial || '',
      project_date: project.project_date || '',
      duration: project.duration || '',
      cost_range: project.cost_range || '',
      featured: project.featured || false
    });
    setShowForm(true);
  };

  const featuredProjects = projects.filter(p => p.featured);
  const regularProjects = projects.filter(p => !p.featured);

  return (
    <div className="min-h-screen bg-[#F5F5F0]">
      {/* Header */}
      <header className="bg-[#1A2F3A] text-white px-6 py-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to={isOwner ? '/dashboard' : '/contractors'} className="text-white/70 hover:text-white">
                <ArrowLeft size={18} />
              </Link>
              <div>
                <h1 className="text-2xl" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                  {contractor?.business_name || 'My'} Portfolio
                </h1>
                <p className="text-sm text-white/70">
                  {projects.length} project{projects.length !== 1 ? 's' : ''} showcased
                </p>
              </div>
            </div>
            {isOwner && (
              <button
                onClick={() => {
                  resetForm();
                  setSelectedProject(null);
                  setShowForm(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-white text-[#1A2F3A] rounded-lg text-sm font-medium hover:bg-gray-100"
                data-testid="add-project-btn"
              >
                <Plus size={16} />
                Add Project
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {/* Contractor Info */}
        {contractor && (
          <div className="bg-white rounded-2xl p-6 mb-6 flex items-center gap-6">
            <div className="w-20 h-20 bg-gray-200 rounded-xl overflow-hidden">
              {contractor.avatar ? (
                <img src={contractor.avatar} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <Image size={24} />
                </div>
              )}
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-[#1A2F3A]">{contractor.business_name}</h2>
              <p className="text-gray-500">{contractor.specialties?.join(', ')}</p>
              <div className="flex items-center gap-4 mt-2 text-sm">
                <span className="flex items-center gap-1">
                  <Star className="text-yellow-400" size={14} fill="currentColor" />
                  {contractor.rating?.toFixed(1) || 'New'}
                </span>
                <span>{contractor.completed_jobs || 0} jobs completed</span>
                <span>{contractor.years_experience || 0} years experience</span>
              </div>
            </div>
            <Link
              to={`/contractors`}
              className="px-4 py-2 bg-[#1A2F3A] text-white rounded-lg text-sm"
            >
              View Profile
            </Link>
          </div>
        )}

        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-2xl p-4 animate-pulse">
                <div className="h-48 bg-gray-200 rounded-xl mb-4" />
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="h-4 bg-gray-200 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center">
            <Image className="mx-auto mb-4 text-gray-300" size={64} />
            <h2 className="text-2xl font-semibold text-[#1A2F3A] mb-2">No Projects Yet</h2>
            <p className="text-gray-500 mb-6">
              {isOwner ? 'Showcase your best work by adding portfolio projects' : 'This contractor hasn\'t added any projects yet'}
            </p>
            {isOwner && (
              <button
                onClick={() => setShowForm(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#1A2F3A] text-white rounded-xl"
              >
                <Plus size={18} />
                Add Your First Project
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Featured Projects */}
            {featuredProjects.length > 0 && (
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-[#1A2F3A] mb-4 flex items-center gap-2">
                  <Award className="text-yellow-500" size={20} />
                  Featured Work
                </h3>
                <div className="grid md:grid-cols-2 gap-6">
                  {featuredProjects.map(project => (
                    <ProjectCard
                      key={project.id}
                      project={project}
                      isOwner={isOwner}
                      onEdit={editProject}
                      onDelete={handleDelete}
                      onToggleFeatured={toggleFeatured}
                      featured
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Regular Projects */}
            {regularProjects.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-[#1A2F3A] mb-4">All Projects</h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {regularProjects.map(project => (
                    <ProjectCard
                      key={project.id}
                      project={project}
                      isOwner={isOwner}
                      onEdit={editProject}
                      onDelete={handleDelete}
                      onToggleFeatured={toggleFeatured}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Add/Edit Project Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-xl font-semibold text-[#1A2F3A]">
                {selectedProject ? 'Edit Project' : 'Add New Project'}
              </h3>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Project Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(p => ({ ...p, title: e.target.value }))}
                  placeholder="e.g., Modern Kitchen Renovation"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl"
                  data-testid="project-title-input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData(p => ({ ...p, category: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl"
                >
                  {categories.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))}
                  placeholder="Describe the project scope, challenges, and results"
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Project Date</label>
                  <input
                    type="month"
                    value={formData.project_date}
                    onChange={(e) => setFormData(p => ({ ...p, project_date: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                  <input
                    type="text"
                    value={formData.duration}
                    onChange={(e) => setFormData(p => ({ ...p, duration: e.target.value }))}
                    placeholder="e.g., 2 weeks"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cost Range</label>
                <input
                  type="text"
                  value={formData.cost_range}
                  onChange={(e) => setFormData(p => ({ ...p, cost_range: e.target.value }))}
                  placeholder="e.g., $5,000 - $10,000"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Client Name (optional)</label>
                <input
                  type="text"
                  value={formData.client_name}
                  onChange={(e) => setFormData(p => ({ ...p, client_name: e.target.value }))}
                  placeholder="Will be displayed with permission"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Client Testimonial (optional)</label>
                <textarea
                  value={formData.client_testimonial}
                  onChange={(e) => setFormData(p => ({ ...p, client_testimonial: e.target.value }))}
                  placeholder="What did the client say about your work?"
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl resize-none"
                />
              </div>

              <label className="flex items-center gap-3 cursor-pointer p-4 bg-gray-50 rounded-xl">
                <input
                  type="checkbox"
                  checked={formData.featured}
                  onChange={(e) => setFormData(p => ({ ...p, featured: e.target.checked }))}
                  className="w-5 h-5 rounded"
                />
                <div>
                  <span className="font-medium text-[#1A2F3A]">Featured Project</span>
                  <p className="text-sm text-gray-500">Highlight this as one of your best works</p>
                </div>
              </label>
            </div>

            <div className="p-6 border-t border-gray-100 flex gap-3">
              <button
                onClick={() => {
                  setShowForm(false);
                  setSelectedProject(null);
                  resetForm();
                }}
                className="flex-1 py-3 border border-gray-200 rounded-xl hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!formData.title || !formData.description}
                className="flex-1 py-3 bg-[#1A2F3A] text-white rounded-xl hover:bg-[#2C4A52] disabled:opacity-50"
                data-testid="save-project-btn"
              >
                {selectedProject ? 'Save Changes' : 'Add Project'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ProjectCard = ({ project, isOwner, onEdit, onDelete, onToggleFeatured, featured }) => {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <>
      <div
        className={`bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow cursor-pointer ${
          featured ? 'ring-2 ring-yellow-400' : ''
        }`}
        onClick={() => setShowDetails(true)}
        data-testid={`project-${project.id}`}
      >
        <div className="relative h-48 bg-gray-100">
          {project.images?.[0] || project.after_images?.[0] ? (
            <img
              src={project.after_images?.[0] || project.images?.[0]}
              alt={project.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <Image size={48} />
            </div>
          )}
          {featured && (
            <div className="absolute top-3 left-3 px-2 py-1 bg-yellow-400 text-yellow-900 text-xs font-medium rounded-full flex items-center gap-1">
              <Award size={12} />
              Featured
            </div>
          )}
          {project.category && (
            <div className="absolute top-3 right-3 px-2 py-1 bg-white/90 text-xs rounded-full capitalize">
              {project.category}
            </div>
          )}
        </div>
        <div className="p-4">
          <h3 className="font-semibold text-[#1A2F3A] line-clamp-1">{project.title}</h3>
          <p className="text-sm text-gray-500 line-clamp-2 mt-1">{project.description}</p>
          {(project.duration || project.cost_range) && (
            <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
              {project.duration && (
                <span className="flex items-center gap-1">
                  <Calendar size={12} />
                  {project.duration}
                </span>
              )}
              {project.cost_range && <span>{project.cost_range}</span>}
            </div>
          )}
          {isOwner && (
            <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
              <button
                onClick={(e) => { e.stopPropagation(); onEdit(project); }}
                className="flex-1 py-2 text-sm text-[#1A2F3A] hover:bg-gray-50 rounded-lg flex items-center justify-center gap-1"
              >
                <Edit2 size={14} />
                Edit
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onToggleFeatured(project.id); }}
                className={`flex-1 py-2 text-sm rounded-lg flex items-center justify-center gap-1 ${
                  project.featured ? 'text-yellow-600 hover:bg-yellow-50' : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                <Award size={14} />
                {project.featured ? 'Unfeature' : 'Feature'}
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(project.id); }}
                className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
              >
                <Trash2 size={14} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Project Details Modal */}
      {showDetails && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowDetails(false)}>
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="relative h-64 bg-gray-100">
              {project.after_images?.[0] || project.images?.[0] ? (
                <img
                  src={project.after_images?.[0] || project.images?.[0]}
                  alt={project.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <Image size={64} />
                </div>
              )}
            </div>
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <span className="text-sm text-gray-500 capitalize">{project.category}</span>
                  <h2 className="text-2xl font-semibold text-[#1A2F3A]">{project.title}</h2>
                </div>
                {project.cost_range && (
                  <span className="px-3 py-1 bg-gray-100 rounded-full text-sm">{project.cost_range}</span>
                )}
              </div>
              <p className="text-gray-600 mb-6">{project.description}</p>
              
              {project.client_testimonial && (
                <div className="bg-gray-50 rounded-xl p-4 mb-6">
                  <p className="text-gray-600 italic">"{project.client_testimonial}"</p>
                  {project.client_name && (
                    <p className="text-sm text-gray-500 mt-2">— {project.client_name}</p>
                  )}
                </div>
              )}

              <div className="flex items-center gap-6 text-sm text-gray-500">
                {project.project_date && <span>Completed: {project.project_date}</span>}
                {project.duration && <span>Duration: {project.duration}</span>}
              </div>

              <button
                onClick={() => setShowDetails(false)}
                className="w-full mt-6 py-3 border border-gray-200 rounded-xl hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ContractorPortfolio;
