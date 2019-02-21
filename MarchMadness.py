from app import app, db, User

@app.shell_context_processor
def make_shell_context():
    return {'app': app, 'db': db, 'User': User}