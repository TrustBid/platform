-- Sprint 8: imagen de portada para proyectos (carrousel del portal público)
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS image_url TEXT;
