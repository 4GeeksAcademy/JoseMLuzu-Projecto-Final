from flask import Flask, request, jsonify, send_from_directory
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager, create_access_token, get_jwt_identity, jwt_required
from werkzeug.security import generate_password_hash, check_password_hash
from flask_cors import CORS
import os

from api.utils import APIException, generate_sitemap
from api.models import db, User, Category, Item
from api.routes import api
from api.admin import setup_admin
from api.commands import setup_commands

app = Flask(__name__)
app.url_map.strict_slashes = False

# Configurar CORS para permitir solicitudes desde el dominio del frontend
frontend_url = "https://fantastic-robot-5ggj95pvqx9xhv64-3000.app.github.dev"
CORS(app, resources={r"/*": {"origins": frontend_url}})

# Determinar el entorno
ENV = "development" if os.getenv("FLASK_DEBUG") == "1" else "production"

# Configuración de archivos estáticos
static_file_dir = os.path.join(os.path.dirname(os.path.realpath(__file__)), '../public/')

# Configuración de JWT
app.config["JWT_SECRET_KEY"] = os.getenv("JWT_KEY", "default_secret_key")
jwt = JWTManager(app)

# Configuración de la base de datos
db_url = os.getenv("DATABASE_URL", "sqlite:////tmp/test.db")
app.config['SQLALCHEMY_DATABASE_URI'] = db_url.replace("postgres://", "postgresql://")
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

MIGRATE = Migrate(app, db, compare_type=True)
db.init_app(app)

# Configuración del administrador
setup_admin(app)

# Configuración de comandos personalizados
setup_commands(app)

# Registro de blueprints
app.register_blueprint(api, url_prefix='/api')

# Manejo y serialización de errores como objetos JSON
@app.errorhandler(APIException)
def handle_invalid_usage(error):
    return jsonify(error.to_dict()), error.status_code

# Generación del sitemap
@app.route('/')
def sitemap():
    if ENV == "development":
        return generate_sitemap(app)
    return send_from_directory(static_file_dir, 'index.html')

# Servir archivos estáticos
@app.route('/<path:path>', methods=['GET'])
def serve_any_other_file(path):
    file_path = os.path.join(static_file_dir, path)
    if not os.path.isfile(file_path):
        path = 'index.html'
    response = send_from_directory(static_file_dir, path)
    response.cache_control.max_age = 0  # Evitar el cacheo
    return response

# Ruta de login
@app.route('/login', methods=['POST'])
def login():
    body = request.get_json()
    if not body:
        return jsonify({"msg": "Body is empty"}), 400
    if "email" not in body or "password" not in body:
        return jsonify({"msg": "Email and password are required"}), 400

    user = User.query.filter_by(email=body["email"]).first()
    if not user or not check_password_hash(user.password, body["password"]):
        return jsonify({"msg": "Invalid email or password"}), 400

    access_token = create_access_token(identity=user.email)
    return jsonify({'msg': "ok", "access_token": access_token}), 200

# Ruta de registro
@app.route('/register', methods=['POST'])
def register():
    body = request.get_json()
    if not body:
        return jsonify({"msg": "Body is empty"}), 400
    if "email" not in body or "password" not in body:
        return jsonify({"msg": "Email and password are required"}), 400

    if User.query.filter_by(email=body["email"]).first():
        return jsonify({"msg": "User already exists"}), 400

    hashed_password = generate_password_hash(body["password"])
    new_user = User(email=body["email"], password=hashed_password, is_active=True)

    try:
        db.session.add(new_user)
        db.session.commit()
    except Exception as e:
        return jsonify({"msg": "Error creating user", "error": str(e)}), 500

    return jsonify({"msg": "User created successfully"}), 201

# Ruta para agregar categoría
@app.route('/categories', methods=['POST'])
def add_category():
    data = request.get_json()
    if not data or 'name' not in data or 'user_id' not in data:
        return jsonify({"msg": "Name and user_id are required"}), 400
    try:
        new_category = Category(name=data['name'], user_id=data['user_id'])
        db.session.add(new_category)
        db.session.commit()
        return jsonify(new_category.serialize()), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 400

# Ruta para obtener todas las categorías
@app.route('/categories', methods=['GET'])
def get_categories():
    try:
        categories = Category.query.all()
        return jsonify([category.serialize() for category in categories]), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 400

# Ruta para eliminar categoría
@app.route('/categories/<int:category_id>', methods=['DELETE'])
def delete_category(category_id):
    try:
        category = Category.query.get(category_id)
        if not category:
            return jsonify({"msg": "Category not found"}), 404
        db.session.delete(category)
        db.session.commit()
        return jsonify({"msg": "Category deleted"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 400

# Ruta para agregar ítem
@app.route('/items', methods=['POST'])
def add_item():
    data = request.get_json()
    if not data or 'name' not in data or 'price' not in data or 'category_id' not in data or 'user_id' not in data:
        return jsonify({"msg": "Name, price, category_id, and user_id are required"}), 400
    try:
        new_item = Item(name=data['name'], price=data['price'], category_id=data['category_id'], user_id=data['user_id'])
        db.session.add(new_item)
        db.session.commit()
        return jsonify(new_item.serialize()), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 400

# Ruta para obtener todos los ítems
@app.route('/items', methods=['GET'])
def get_items():
    try:
        items = Item.query.all()
        return jsonify([item.serialize() for item in items]), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 400

# Ruta para eliminar ítem
@app.route('/items/<int:item_id>', methods=['DELETE'])
def delete_item(item_id):
    try:
        item = Item.query.get(item_id)
        if not item:
            return jsonify({"msg": "Item not found"}), 404
        db.session.delete(item)
        db.session.commit()
        return jsonify({"msg": "Item deleted"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 400

# Ruta protegida
@app.route('/private', methods=['GET'])
@jwt_required()
def private():
    identity = get_jwt_identity()
    return jsonify({'msg': 'This is a private message'})

# Ejecutar la aplicación Flask
if __name__ == '__main__':
    PORT = int(os.environ.get('PORT', 3001))
    app.run(host='0.0.0.0', port=PORT, debug=ENV == "development")
