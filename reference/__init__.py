from flask import Flask, render_template, flash, redirect, url_for, session, request, redirect, jsonify
from flask_wtf import FlaskForm
from wtforms import StringField, PasswordField, BooleanField, SubmitField
from wtforms.validators import ValidationError, DataRequired, Email, EqualTo
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from werkzeug.security import generate_password_hash, check_password_hash
from flask_login import LoginManager, UserMixin, current_user, login_user, logout_user, login_required

import scoring
import os
import score_scraper

app = Flask(__name__)

#SQAlchemy Configurations
app.config['SECRET_KEY'] = 'secret123'
basedir = os.path.abspath(os.path.dirname(__file__))
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(basedir, 'app.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)
migrate = Migrate(app, db)

#login
login = LoginManager(app)

@login.user_loader
def load_user(id):
    return User.query.get(int(id))

#index
@app.route('/')
def index():
    firstname = ""
    lastname = ""
    if current_user.is_authenticated:
        firstname = request.args.get('firstname', default = current_user.firstname, type = str)
        lastname = request.args.get('lastname', default = current_user.lastname, type = str)
    row_id = [firstname,lastname]
    master = score_scraper.get_master_bracket()
    elim = score_scraper.get_elim()
    users = User.query.all()
    end_rounds = scoring.get_end_rounds(users)
    score = order = rank = potential = game_scores = seo = None
    score = scoring.score(master,users)
    order = scoring.order(score)
    rank = scoring.rank(order,score)
    potential = scoring.potential(elim,users,master)
    game_scores = score_scraper.get_scoreticker_json()
    seo = score_scraper.convert_short_to_seo()
    # Test overlays
    # elim = elim + ['1 Purdue','1 Houston']
    # master[60] = '1 Alabama'
    return render_template('index.html',users=users, score=score, potential=potential, end_rounds=end_rounds, elim=elim, order=order, rank=rank, User=User, master=master, matches=game_scores,seo=seo,row_id=row_id)

#bracket form
@app.route('/bracketEntry', methods=['GET', 'POST'])
def bracketEntry():
    game_scores = score_scraper.get_scoreticker_json()
    bracket_teams = score_scraper.get_bracket_teams()
    print(bracket_teams)
    # bracket_teams[1] = '16 TAMU-CC/SEMO'
    # bracket_teams[57] = '11 Ariz St./Nevada'
    # bracket_teams[17] = '16 TX SOU/FDU'
    # bracket_teams[41] = '11 Miss St./PITT'
    if current_user.is_authenticated:
      return render_template("alt_bracketEntry.html",matches=game_scores,teams=bracket_teams)
    else:
      return login()

@app.route('/entries')
def entries():
    users = User.query.all()
    users.sort(key=lambda x: x.firstname, reverse=False)
    master = score_scraper.get_master_bracket()
    score = scoring.score(master,users)
    order = scoring.order(score)
    rank = scoring.rank(order,score)
    bracket_teams = score_scraper.get_bracket_teams()
    if current_user.is_authenticated:
        user_id = request.args.get('id', default = current_user.id, type = int)
    else:
        user_id = request.args.get('id', default = 1, type = int)
    elim = score_scraper.get_elim()
    game_scores = score_scraper.get_scoreticker_json()
    if user_id == -1 or User.query.get(user_id).round1 is None:
        display = []
    else:
        display = User.query.get(user_id).round1.replace('"','').replace('[','').replace(']','').split(',')
    return render_template('entries.html',users=users, display=display,master=master,elim=elim,user_id=user_id,User=User,order=order,Users=users,rank=rank,matches=game_scores,teams=bracket_teams)
    # game_scores = score_scraper.get_scoreticker_json()
    # return render_template('alt_entries.html',matches=game_scores)

@app.route('/matches')
def matches():
    users = User.query.all()
    rounds = []
    for user in users:
      display = ['']
      if user.round1 is not None:
        display = user.round1.replace('"','').replace('[','').replace(']','').split(',')
      rounds.append(display)
    game_scores = score_scraper.get_scoreticker_json()
    game_id = request.args.get('id', default = 1, type = int)
    game_data = score_scraper.get_game_data()
    game_id_selection = score_scraper.convert_ncaa_to_master(game_data[game_id][3])
    return render_template('matches.html',users=users,matches=game_scores,game_id=game_id,game_data=game_data, game_selected=game_id_selection,rounds=rounds)

#master
@app.route('/master')
def master():
    game_scores = score_scraper.get_scoreticker_json()
    display = score_scraper.get_master_bracket()
    bracket_teams = score_scraper.get_bracket_teams()
    return render_template('master.html',display=display,matches=game_scores,teams=bracket_teams)

#stats
@app.route('/stats')
def stats():
    game_scores = score_scraper.get_scoreticker_json()
    return render_template('stats.html',matches=game_scores)

#past_winners
@app.route('/past_winners')
def past_winners():
    game_scores = score_scraper.get_scoreticker_json()
    return render_template('past_winners.html',matches=game_scores)

@app.route('/possibilities')
def possibilities():
    game_scores = score_scraper.get_scoreticker_json()
    return render_template("possibilities.html",matches=game_scores)

#login
@app.route('/login', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        return redirect(url_for('index'))
    form = LoginForm()
    if form.validate_on_submit():
        user = User.query.filter_by(email=form.email.data).first()
        if user is None or not user.check_password(form.password.data):
            flash('Invalid name or password')
            return redirect(url_for('login'))
        login_user(user, remember=form.remember_me.data)
        next_page = request.args.get('next')
        if not next_page:
            next_page = url_for('index')
        return redirect(next_page)
    return render_template('login.html', title='Sign In', form=form)

#logout
@app.route('/logout')
def logout():
    logout_user()
    return redirect(url_for('index'))

#register
@app.route('/register', methods=['GET', 'POST'])
def register():
    if current_user.is_authenticated:
        return redirect(url_for('index'))
    form = RegistrationForm()
    if form.validate_on_submit():
        user = User(firstname=form.firstname.data, lastname= form.lastname.data, email=form.email.data, round1="\"")
        user.set_password(form.password.data)
        db.session.add(user)
        db.session.commit()
        flash('Congratulations, you are now a registered user!')
        return redirect(url_for('login'))
    return render_template('register.html', title='Register', form=form)

#CLASSES
class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    firstname = db.Column(db.String(64), index=True, unique=False)
    lastname = db.Column(db.String(64), index=True, unique=False)
    email = db.Column(db.String(120), index=True, unique=True)
    round1 = db.Column(db.String(1000), index=True)
    password_hash = db.Column(db.String(128))

    def __repr__(self):
        return '<User {}>'.format(self.firstname)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def set_bracket(self, round1):
        self.round1 = round1

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

#Login validation
class LoginForm(FlaskForm):
    email = StringField('Email', validators=[DataRequired()])
    password = PasswordField('Password', validators=[DataRequired()])
    remember_me = BooleanField('Remember Me')
    submit = SubmitField('Sign In')

#Registration
class RegistrationForm(FlaskForm):
    firstname = StringField('First Name', validators=[DataRequired()])
    lastname = StringField('Last Name', validators=[DataRequired()])
    email = StringField('Email', validators=[DataRequired(), Email()])
    password = PasswordField('Password', validators=[DataRequired()])
    password2 = PasswordField(
        'Repeat Password', validators=[DataRequired(), EqualTo('password')])
    submit = SubmitField('Register')

    def validate_email(self, email):
        user = User.query.filter_by(email=email.data).first()
        if user is not None:
            raise ValidationError('Please use a different email address.')

@app.route('/background_process')
def background_process():
    submissionkey = request.args.get('submissionkey', 0, type=str)
    lang = request.args.get('proglang', 0, type=str)
    submissionkey='Mosier2019'
    if scoring.isBracketEmpty(lang) or lang =="\"\"":
        return jsonify(result='Bracket Is Not Filled Correctly')
    elif submissionkey=='Mosier2019':
        current_user.set_bracket(lang)
        db.session.commit()
        return jsonify(result='Bracket Submitted!')
    else:
        return jsonify(result='Incorrect Bracket Key')

if __name__ == '__main__':
    app.run(debug=True)